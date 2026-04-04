import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TradeRequest {
  skillId: string;
  type: "buy" | "sell";
  quantity: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { skillId, type, quantity }: TradeRequest = await req.json();

    if (!skillId || !type || !quantity || quantity <= 0) {
      throw new Error("Invalid trade parameters");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("balance, referral_rewarded, referred_by")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    const { data: skill, error: skillError } = await supabaseAdmin
      .from("skills")
      .select("*")
      .eq("id", skillId)
      .single();

    if (skillError || !skill) {
      throw new Error("Skill not found");
    }

    const totalValue = skill.current_price * quantity;
    let newBalance = profile.balance;
    let newQuantity = 0;

    if (type === "buy") {
      if (profile.balance < totalValue) {
        throw new Error("Insufficient balance");
      }
      newBalance = profile.balance - totalValue;

      const { data: holding } = await supabaseAdmin
        .from("holdings")
        .select("quantity, average_buy_price")
        .eq("user_id", user.id)
        .eq("skill_id", skillId)
        .maybeSingle();

      if (holding) {
        const totalCost = (holding.average_buy_price * holding.quantity) + totalValue;
        newQuantity = holding.quantity + quantity;
        const newAvgPrice = totalCost / newQuantity;

        await supabaseAdmin
          .from("holdings")
          .update({
            quantity: newQuantity,
            average_buy_price: newAvgPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("skill_id", skillId);
      } else {
        await supabaseAdmin.from("holdings").insert({
          user_id: user.id,
          skill_id: skillId,
          quantity: quantity,
          average_buy_price: skill.current_price,
        });
      }
    } else {
      const { data: holding } = await supabaseAdmin
        .from("holdings")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("skill_id", skillId)
        .maybeSingle();

      if (!holding || holding.quantity < quantity) {
        throw new Error("Insufficient holdings");
      }

      newBalance = profile.balance + totalValue;
      newQuantity = holding.quantity - quantity;

      if (newQuantity === 0) {
        await supabaseAdmin
          .from("holdings")
          .delete()
          .eq("user_id", user.id)
          .eq("skill_id", skillId);
      } else {
        await supabaseAdmin
          .from("holdings")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("skill_id", skillId);
      }
    }

    await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    await supabaseAdmin.from("trades").insert({
      user_id: user.id,
      skill_id: skillId,
      type: type,
      quantity: quantity,
      price: skill.current_price,
      total_value: totalValue,
    });

    const priceFactor = 0.01;
    const volumeDiff = type === "buy" ? quantity : -quantity;
    const newPrice = Math.max(skill.current_price + (volumeDiff * priceFactor), 1);

    await supabaseAdmin
      .from("skills")
      .update({
        current_price: newPrice,
        total_buy_volume: type === "buy" ? skill.total_buy_volume + quantity : skill.total_buy_volume,
        total_sell_volume: type === "sell" ? skill.total_sell_volume + quantity : skill.total_sell_volume,
      })
      .eq("id", skillId);

    await supabaseAdmin.from("price_history").insert({
      skill_id: skillId,
      price: newPrice,
    });

    const { data: tradeCount } = await supabaseAdmin
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (tradeCount && tradeCount === 1 && profile.referred_by && !profile.referral_rewarded) {
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("id, balance")
        .eq("referral_code", profile.referred_by)
        .maybeSingle();

      if (referrer) {
        await supabaseAdmin
          .from("profiles")
          .update({ balance: referrer.balance + 1000 })
          .eq("id", referrer.id);

        await supabaseAdmin
          .from("profiles")
          .update({ balance: newBalance + 500, referral_rewarded: true })
          .eq("id", user.id);

        await supabaseAdmin.from("referral_rewards").insert({
          referrer_id: referrer.id,
          referee_id: user.id,
          referrer_amount: 1000,
          referee_amount: 500,
        });

        newBalance += 500;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        newBalance,
        newPrice,
        message: `Successfully ${type === "buy" ? "bought" : "sold"} ${quantity} units`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

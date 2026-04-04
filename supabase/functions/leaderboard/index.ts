import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, balance, referral_code");

    if (profilesError) {
      throw new Error("Failed to fetch profiles");
    }

    const { data: skills, error: skillsError } = await supabaseAdmin
      .from("skills")
      .select("id, current_price");

    if (skillsError) {
      throw new Error("Failed to fetch skills");
    }

    const skillPriceMap = new Map(skills.map(s => [s.id, s.current_price]));

    const leaderboardPromises = profiles.map(async (profile) => {
      const { data: holdings } = await supabaseAdmin
        .from("holdings")
        .select("skill_id, quantity, average_buy_price")
        .eq("user_id", profile.id);

      let totalInvested = 0;
      let currentValue = 0;

      if (holdings && holdings.length > 0) {
        holdings.forEach(holding => {
          totalInvested += holding.average_buy_price * holding.quantity;
          const currentPrice = skillPriceMap.get(holding.skill_id) || 0;
          currentValue += currentPrice * holding.quantity;
        });
      }

      const totalWealth = profile.balance + currentValue;
      const profit = totalWealth - 10000;

      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email || "Anonymous";

      return {
        userId: profile.id,
        email: email.split("@")[0],
        balance: profile.balance,
        portfolioValue: currentValue,
        totalWealth,
        profit,
        profitPercentage: ((profit / 10000) * 100).toFixed(2),
      };
    });

    const leaderboard = await Promise.all(leaderboardPromises);
    leaderboard.sort((a, b) => b.profit - a.profit);

    const top100 = leaderboard.slice(0, 100);

    return new Response(
      JSON.stringify({ leaderboard: top100 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

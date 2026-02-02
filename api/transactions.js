import { createClient } from "@supabase/supabase-js";

// helper: create client with user token
function getSupabaseClient(userToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    }
  );
}

export default async function handler(req, res) {
  // 1️⃣ get token from request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient(token);

  // 2️⃣ verify user
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Invalid user" });
  }

  const userId = userData.user.id;

  // 3️⃣ GET transactions
  if (req.method === "GET") {
    const { month, year } = req.query;

    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (month && year) {
      query = query
        .gte(
          "created_at",
          `${year}-${month}-01`
        )
        .lt(
          "created_at",
          `${year}-${month}-31`
        );
    }

    const { data, error } = await query;

    if (error) return res.status(500).json(error);
    return res.status(200).json(data);
  }

  // 4️⃣ ADD transaction
  if (req.method === "POST") {
    const { amount, type, note, proof_url } = req.body;

    const { error } = await supabase
      .from("transactions")
      .insert([
        {
          amount,
          type,
          note,
          proof_url: proof_url || null,
          user_id: userId
        }
      ]);

    if (error) return res.status(500).json(error);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

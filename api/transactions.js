import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json(error);
    }

    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { amount, type, note } = req.body;

    const { error } = await supabase
      .from("transactions")
      .insert([{ amount, type, note }]);

    if (error) {
      return res.status(500).json(error);
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}


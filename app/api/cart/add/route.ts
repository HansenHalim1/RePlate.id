import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, quantity = 1, user_id } = body;

  if (!user_id || !product_id)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = supabaseServer();

  // Check if already in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user_id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Quantity updated" });
  }

  const { error } = await supabase
    .from("cart_items")
    .insert({ user_id, product_id, quantity });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Added to cart" });
}

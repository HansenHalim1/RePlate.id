import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {
  // Example for later:
  // await supabaseServer.from("cart_items").delete().eq("user_id", userId);

  return NextResponse.json({
    ok: true,
    message: "Cart cleared (mock only)",
  });
}

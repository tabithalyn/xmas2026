import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    const items = await db
      .select()
      .from(wishlistItems)
      .orderBy(desc(wishlistItems.id))

    return NextResponse.json(items)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { message: "Could not load wishlist" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const {
      name,
      store,
      price,
      image_url,
      product_url,
      preference,
    } = body;

    const validation = {
      name: typeof name === "string" && !!name.trim(),
      store: typeof store === "string" && !!store.trim(),
      price:
        price !== null &&
        price !== undefined &&
        Number.isSafeInteger(Number(price)) &&
        Number(price) >= 0,
      product_url:
        typeof product_url === "string" && !!product_url.trim(),
    };

    console.log("[WISHLIST VALIDATION]", validation);

    if (Object.values(validation).some((valid) => !valid)) {
      return NextResponse.json(
        {
          message: "Please provide valid product details",
          validation,
        },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(wishlistItems)
      .values({
        name: name.trim(),
        store: store.trim(),
        price: Number(price),
        image_url: image_url || null,
        product_url: product_url.trim(),
        preference: preference || null,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Could not add wishlist item" },
      { status: 500 }
    );
  }
}
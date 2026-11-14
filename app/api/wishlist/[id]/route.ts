import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";

type Props = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: Props,
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      store,
      price,
      image_url,
      product_url,
      preference
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof store !== "string" ||
      !store.trim() ||
      !Number.isSafeInteger(Number(price)) ||
      Number(price) < 0 ||
      typeof product_url !== "string" ||
      !product_url.trim()
    ) {
      return NextResponse.json(
        { message: "Please provide valid product details" },
        { status: 400 }
      );
    }

    const [item] = await db
      .update(wishlistItems)
      .set({
        name: name.trim(),
        store: store.trim(),
        price: Number(price),
        image_url: image_url || null,
        product_url: product_url.trim(),
        preference: preference || null,
      })
      .where(eq(wishlistItems.id, id))
      .returning();

    if (!item) {
      return NextResponse.json(
        { message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Wishlist update error: ", error);

    return NextResponse.json(
      { message: "Could not update wishlist item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Props
) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "Invalid item ID" },
        { status: 400 }
      );
    }

    const [item] = await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .returning();

    if (!item) {
      return NextResponse.json(
        { message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Wishlist item deleted",
    });
  } catch (error) {
    console.error("Wishlist deletion error:", error);

    return NextResponse.json(
      { message: "Could not delete wishlist item" },
      { status: 500 }
    );
  }
}
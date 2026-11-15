"use client"

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type SubmitEvent } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow, 
  ExternalLink, 
  Gift, 
  Heart, 
  LockKeyhole, 
  LogOut, 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  TreePine,
  X, 
  Pencil, 
  Image as ImageIcon,
  Snowflake, 
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const API_URL = "/api";

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [activeStore, setActiveStore] = useState("All");
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [draft, setDraft] = useState<WishlistDraft>({
    name: "",
    store: "",
    price: 0,
    image_url: "",
    product_url: "",
    preference: "",
  });

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const { data: session } = authClient.useSession();

  useEffect(() => {
    setAdminMode(!!session);
  }, [session]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(price / 100);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/wishlist`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load wishlist");
      }

      const data: WishlistItem[] = await res.json();
      setItems(data);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not load wishlist"
      )
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const stores = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(items.map(item => item.store).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [items]
  );

  const visibleItems = useMemo(() => {
    let result = items.filter(
      item => activeStore === "All" || item.store === activeStore
    );

    if (search.trim()) {
      const term = search.toLowerCase();

      result = result.filter(item =>
        `${item.name} ${item.store} ${item.preference ?? ""}`
          .toLowerCase()
          .includes(term)
      );
    }

    if (sort === "asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    }

    if (sort === "desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, activeStore, sort, search]);

  const openNew = () => {
    setEditingId(null);

    setDraft({
      name: "",
      store: "",
      price: 0,
      image_url: "",
      product_url: "",
      preference: "",
    });

    setEditorOpen(true);
  }

  const openEdit = (item: WishlistItem) => {
    setEditingId(item.id);

    setDraft({
      name: item.name,
      store: item.store,
      price: Number(item.price),
      image_url: item.image_url ?? "",
      product_url: item.product_url ?? "",
      preference: item.preference ?? "",
    });

    setEditorOpen(true);
  }

  const saveItem = async (event: SubmitEvent) => {
    event.preventDefault();

    if (
      !draft.name.trim() ||
      !draft.store.trim() ||
      !draft.product_url.trim() ||
      draft.price === 0 ||
        !Number.isFinite(Number(draft.price)) ||
        Number(draft.price) < 0 ||
        Number(draft.price) > 99999999
    ) {
      setNotice("Please provide a name, store, valid price, and product URL.");
      return;
    }

    setSaving(true);

    const priceInCents = Math.round(Number(draft.price) * 100);

    const payload = {
      name: draft.name.trim(),
      store: draft.store.trim(),
      price: priceInCents,
      image_url: draft.image_url.trim() || null,
      product_url: draft.product_url.trim() || null,
      preference: draft.preference.trim() || null,
    }

    try {
      const res = await fetch(
        editingId
          ? `${API_URL}/wishlist/${editingId}`
          : `${API_URL}/wishlist`,
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Could not save item.");
      }

      await loadItems();

      setNotice(
        editingId ? "Wishlist item updated." : "Wishlist item added."
      );

      setEditorOpen(false);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save item"
      );
    } finally {
      setSaving(false);
    }
  }

  const deleteItem = async (id: number | null) => {
    if (!window.confirm("Remove this item from your wishlist?")) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/wishlist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Could not remove item");
      }

      await loadItems();
      setNotice("Item removed");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not remove item"
      );
    }
  }

  const signIn = async (event: SubmitEvent) => {
    event.preventDefault();

    setAuthMessage("Signing in…");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setAuthMessage(error.message || "");
      return;
    }

    setAuthOpen(false);
    setPassword("");
    setAuthMessage("");
    await loadItems();
    setNotice("Welcome back!");
  }

  const signOut = async () => {
    await authClient.signOut();
    setAdminMode(false);
    await loadItems();
    setNotice("You've signed out. The wishlist remains public.");
  }

  const startAdmin = () => {
    if (session) {
      setAdminMode(value => !value);
    } else {
      setAuthOpen(true);
      setAuthMessage("");
    }
  }

  return (
    <main className="min-h-screen w-screen">
      <div className="min-h-9 w-full bg-[#203c32] text-[#ebe2d2] flex items-center justify-between gap-2 py-2 px-4 sm:px-[5.5%] text-[9px] tracking-wider font-bold">
        <span>✳ &nbsp; A LITTLE CHRISTMAS MAGIC &nbsp; ✳</span><span>THE 2026 EDITION</span>
      </div>
      <header className="relative text-center px-4 pt-16 sm:pt-20 pb-12 sm:pb-14 bg-radial-[at 50% 0%,rgba(169,181,160,.24),transparent 62%),#f4efe5]; overflow-hidden">
        <div className="absolute text-[#b69a70] opacity-40 text-[34px] left-[23%] top-[25%]">✳</div>
        <div className="absolute text-[#b69a70] opacity-40 right-[24%] top-[24%] text-[42px]">✧</div>
        <div className="flex items-center justify-center gap-3.25 text-[#9a8059] text-[9px] tracking-wider font-extrabold">
          <span className="h-px w-8 bg-[#b69a70]" /> THE MOST WONDERFUL TIME OF THE YEAR <span className="h-px w-8 bg-[#b69a70]" />
        </div>
        <h1 className="font-display text-[clamp(36px,6vw,76px)] tracking-tight leading-tight mt-5 mb-4 text-[#203c32]">
          My Christmas <span className="font-medium text-[#873f3d] italic font-display">Wishlist</span>
        </h1>
        <p className="font-display italic text-[#69766a] text-[17px] md:text-[17px] lg:text-[18px] xs:text-[14px] my-0 mx-auto max-w-135 leading-8">
          Some things that would make this season extra special.
        </p>
        <div className="flex items-center justify-center gap-3.25 text-[#b69a70] mt-6.5"><span className="h-px w-8 bg-[#b69a70]" />
          <Snowflake size={15} /> <span className="h-px w-8 bg-[#b69a70]" />
        </div>
      </header>

      <section className="w-full max-w-7xl mx-auto pt-5.5 pr-10.5 pb-12 sm:px-6 lg:px-8 xs:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-6.5 pb-6.75 border-b border-b-[#dcd3c4]">
          <div>
            <p className="text-[9px] tracking-wide font-extrabold text-[#9a8059] mt-0 mr-0 mb-2.25">A CURATED COLLECTION</p>
            <h2 className="font-display font-normal text-[30px] sm:text-[34px] text-[#203c32] m-0">On my wish list <span className="font-serif text-[#b69a70] text-[20px] align-top">✳</span></h2>
            <p className="text-[#7d8278] text-[12px] mt-1.75">
              {items.length} {items.length === 1 ? 'thoughtful find' : 'thoughtful finds'} for the season
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {adminMode && session && (
              <button className="inline-flex items-center justify-center gap-2 border border-[#203c32] rounded-[99px] bg-[#203c32] text-[#fff9ee] py-2.75 px-4.75 text-[12px] font-bold transition-all hover:bg-[#315447] hover:translate-u-[-1px] disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none" onClick={openNew}>
                <Plus size={16}/> Add a wish
              </button>
            )}
            {adminMode && session ? (
              <button className="inline-flex items-center gap-2 border border-[#cfc5b5] rounded-[99px] bg-transparent text-[#526256] py-2.5 px-4 text-[11px] xs:text-[9px] font-bold transition-all hover:bg-[#e9e3d8]" onClick={signOut}>
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <button className="inline-flex items-center gap-2 border border-[#cfc5b5] rounded-[99px] bg-transparent text-[#526256] py-2.5 px-4 xs:py-1.5 xs:px-3 text-[11px] xs:text-[9px] font-bold transition-all hover:bg-[#e9e3d8]" onClick={startAdmin}>
                <LockKeyhole size={15} /> Admin
              </button>
            )}
          </div>
        </div>

        {adminMode && session && (
          <div className="flex items-center justify-between gap-3 py-3.25 px-4 mt-4.5 border rounded-lg text-[12px] bg-[#e5e9df] text-[#344b3d]">
            <span className="flex items-center gap-2">
              <LockKeyhole size={15}/> You're in edit mode. Changes are saved to your wishlist.
            </span>
          </div>
        )}

        {notice && (
          <div
            className="flex items-center justify-space-between gap-3 py-3.25 px-4 mt-4.5 border rounded-lg text-[12px] bg-[#e3e9df] text-[#344b3d]"
            role="status"
          >
            <span>{notice}</span>
            <button
              onClick={() => setNotice('')}
              aria-label="Dismiss"
              className="border-0 bg-transparent color-inherit flex"
            >
              <X size={15}/>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 py-6">
          <div>
            <div className="text-[10px] tracking-wide text-[#8b8b7c] font-extrabold mb-2.75">SHOP BY STORE</div>
            <div className="w-full lg:flex-1 flex flex-wrap gap-1.75 justify-end xs:justify-start text-sm">
              {stores.map(store => (
                <button
                  key={store}
                  className={`border rounded-[99px] py-2.25 px-3.75 font-normal transition-all whitespace-nowrap
                    ${
                      activeStore === store
                        ? "bg-[#203c32] border-[#203c32] text-[#fff9ee]! hover:bg-[#315447]"
                        : "bg-transparent border-[#d8d0c2] text-[#526256] hover:border-[#819182] hover:bg-[#ece9df]"
                    }`}
                  onClick={() => setActiveStore(store)}
                >
                  {store === "All" ? "All stores" : store}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-auto lg:text-right">
            <div className="text-[10px] tracking-wide text-[#8b8b7c] mb-3 font-extrabold">SORT BY PRICE</div>
            <div className="flex flex-wrap gap-1.75">
              <button
                className={`border rounded-[99px] py-2.25 px-3.75 text-[11px] font-normal transition-all whitespace-nowrap flex items-center gap-1.75
                  ${
                    sort === "asc"
                      ? "bg-[#203c32] border-[#203c32] text-[#fff9ee]"
                      : "bg-transparent border-[#d8d0c2] text-[#526256] hover:bg-[#ece9df]"
                  }`}
                onClick={() => setSort(sort === "asc" ? "none" : "asc")}
              >
                <ArrowUpWideNarrow size={15}/>
                <span className="text-[12px] font-medium">Lowest first</span>
              </button>
              <button
                className={`border rounded-[99px] py-2.25 px-3.75 text-[11px] font-normal transition-all whitespace-nowrap flex items-center gap-1.75
                  ${
                    sort === "desc"
                      ? "bg-[#203c32] border-[#203c32] text-[#fff9ee]"
                      : "bg-transparent border-[#d8d0c2] text-[#526256] hover:bg-[#ece9df]"
                  }`}
                onClick={() => setSort(sort === "desc" ? "none" : "desc")}
              >
                <ArrowDownWideNarrow size={15}/>
                <span className="text-[12px] font-medium">Highest first</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-4 border-t border-t-[#dfd7c9] text-[#9a9588] text-[9px] tracking-wide font-extrabold">
          <span>SHOWING {visibleItems.length} OF {items.length} WISHES</span>
          <label className="flex items-center gap-2 w-full sm:w-auto text-[#7b8277] text-[12px] border-b border-b-[#d2c9b9] pt-1.5 font-normal">
            <Search size={15}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Find a wish…"
              className="border-0 outline-0 bg-transparent text-[#203c32] w-full sm:w-44 tracking-normal py-1"
            />
          </label>
        </div>

        {loading ? (
          <div className="font-display py-16.25 px-5 text-center text-[#798477] flex items-center justify-center flex-direction-column gap-2.25">
            <Sparkles size={18} />
            Gathering a little Christmas magic…
          </div>
        ) :
          visibleItems.length === 0 ? (
            <div className="py-16.25 px-5 text-center text-[#798477] flex items-center flex-direction-column gap-2.25">
              <Gift size={28}/>
              <h3 className="font-display text-[24px] font-normal text-[#203c32] m-0">No wishes found</h3>
              <p className="text-[12px] m-0">Try another store or search term.</p>
              <button className="border-none bg-transparent text-[#873f3d] underline text-[12px] mt-2" onClick={() => { setActiveStore("All"); setSearch("") }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {visibleItems.map((item, index) => <article className="min-w-0 bg-[#f8f5ee] border border-[#e5ded2] transition-[transform,box-shadow] duration-250 hover:shadow-[0 12px 28px rgba(43,58,46,.08)]" key={item.id}>
                <div className="relative aspect-4/4.5 bg-[#e9e4d9] overflow-hidden">
                  {item.image_url ? (
                    <Image
                      className="w-full h-full object-cover block"
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      fill
                      onError={e => { e.currentTarget.style.display = "none" }}
                    />
                  ) : (
                    <div className="h-full; flex items-center justify-center flex-direction-column gap-2.5 text-[#8b9587]">
                      <ImageIcon size={30}/>
                      <span className="text-[8px] tracking-wide">IMAGE COMING SOON</span>
                    </div>
                  )}
                <span className="absolute left-3 top-3 bg-[rgba(244,239,229,.9)] text-[#6a7468] py-1.5 px-2.25 text-[8px] tracking-wide">WISH {String(index + 1).padStart(2, "0")}</span>
                {adminMode && session && (
                  <div className="absolute right-2.5 top-2.5 flex gap-1.5">
                    <button aria-label="Edit item" onClick={() => openEdit(item)} className="w-8 h-8 border-0 rounded-[50%] bg-[rgba(244,239,229,.95)] text-[#203c32]grid place-items-center hover:bg-white">
                      <Pencil size={15}/>
                    </button>
                    <button aria-label="Delete item" onClick={() => deleteItem(item.id)} className="w-8 h-8 border-0 rounded-[50%] bg-[rgba(244,239,229,.95)] text-[#203c32]grid place-items-center hover:bg-white">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4.75 sm:p-5.5">
                <div className="text-[9px] tracking-wider uppercase text-[#9a8059] font-extrabold">
                  {item.store}
                </div>
                <h3 className="font-display font-normal text-[#273d33] text-base sm:text-[19px] leading-7 mt-2 mb-1.75">
                  {item.name}
                </h3>
                <div className="text-[15px] font-extrabold text-[#203c32] ml-2">
                  {formatPrice(item.price)}
                </div>
                <div className="flex flex-wrap gap-y-1.75 gap-x-3.25 mt-3.25 text-[#667266] text-[10px]">
                  <span>
                    {item.preference && <b className="font-extrabold text-[#44595b] mr-1">
                      {item.preference}
                    </b>}
                  </span>
                </div>
                <div className="border-t border-t-[#b1b7ad] mt-3 flex items-center justify-center">
                {item.product_url ? (
                  <a
                    className="inline-flex items-center gap-1.75 mt-4.25 text-[#873f3d] text-[12px] tracking-widest font-extrabold hover:text-[#203c32]"
                    href={item.product_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LINK TO PRODUCT <ExternalLink size={13}/>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.75 mt-4.25 text-[9px] tracking-extrawide font-extrabold hover:text-[#203c32] text-[#aaa395] p-1">
                    PRODUCT LINK NOT ADDED
                  </span>
                )}
                </div>
              </div>
            </article>)}
          </div>)
        }
      </section>

      <footer className="flex items-center justify-center gap-2.5 bg-[#203c32] text-[#d9c9ac] py-4.75 px-3 text-[10px] tracking-widest font-medium">
        <TreePine size={14}/> THANK YOU SO MUCH <TreePine size={14}/>
      </footer>

      {authOpen && (
        <div
          className="fixed inset-0 bg-[rgba(21,37,29,.58)] z-20 flex items-center justify-center p-5 overflow-y-auto"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setAuthOpen(false)
          }}
        >
        <form className="relative bg-[#f8f5ee] border border-[#ded5c6] rounded-xl p-5 sm:p-8 w-full max-w-102.5 max-h-[calc(100vh-40px)] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)] text-center" onSubmit={signIn}>
          <button
            type="button"
            className="absolute right-4.25 top-4.25 border-none bg-transparent text-[#667266] p-1.25"
            onClick={() => setAuthOpen(false)}
          >
            <X size={18}/>
          </button>
          <div className="w-10.5 h-10.5 rounded-[50%] bg-[#e7e9df] text-[#47604e] grid place-items-center mx-auto mb-4.5">
            <LockKeyhole size={20}/>
          </div>

          <p className="text-[9px] tracking-wide font-extrabold text-[#9a8059] mt-0 mr-0 mb-2.25">JUST FOR YOU</p>
          <h2 className="font-display font-normal text-[34px] text-[#203c32] m-0">Welcome back</h2>
          <p className="font-display font-italic text-[#7a8176] text-[13px] mt-1.75 mx-0 mb-5.5">Sign in to tend to your wishlist.</p>

          <label className="flex flex-direction-column gap-1.75 text-left text-[#586657] text-[12px] mb-3.5">
            <span className="mt-3 text-left font-bold">EMAIL</span>
            <input
              type="email"
              required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-2.75 px-3 outline-none text-[#273d33] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
            />
          </label>

          <label className="flex flex-direction-column gap-1.75 text-left text-[#586657] text-[12px] font-bold mb-3.5">
            <span className="mt-3 w-[20%] text-left">PASSWORD</span>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-[80%] border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-2.75 px-3 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
            />
          </label>
          {authMessage && (
            <p className="ftext-[11px] text-[#873f3d] leading-8">{authMessage}</p>
          )}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 border border-[#203c32] rounded-[99px] bg-[#203c32] text-[#fff9ee] py-2.75 px-4.75 text-[12px] font-bold transition-all w-full mt-1.25 hover:bg-[#315447] hover:translate-u-[-1px]"
          >
            Sign In
          </button>
        </form>
      </div>)}

      {editorOpen && (
        <div
          className="fixed inset-0 bg-[rgba(21,37,29,.58)] z-20 flex items-center justify-center p-5 overflow-y-auto"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setEditorOpen(false)
          }}
        >
          <form className="relative bg-[#f8f5ee] border border-[#ded5c6] rounded-xl p-5 sm:p-8 w-full max-w-165 max-h-[calc(100vh-40px)] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.2)]" onSubmit={saveItem}>
            <button
              type="button"
              className="absolute right-4.25 top-4.25 border-none bg-transparent text-[#667266] p-1.25"
              onClick={() => setEditorOpen(false)}
            >
              <X size={18}/>
            </button>

            <p className="text-[9px] tracking-wide font-extrabold text-[#9a8059] mt-0 mr-0 mb-2.25">THE WISH LIST</p>
            <h2>{editingId ? "Edit your wish" : "Add a new wish"}</h2>
            <p className="font-display font-italic text-[#7a8176] text-[13px] mt-1.75 mx-0 mb-5.5">A few details to make gift-giving a little easier.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2">Product Name
                <input
                  required
                  value={draft.name}
                  onChange={e => setDraft({...draft, name: e.target.value})}
                  placeholder="e.g. Cashmere sweater"
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-1.75 px-3 m-2 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
              <label>Store
                <input
                  required
                  value={draft.store}
                  onChange={e => setDraft({...draft, store: e.target.value})}
                  placeholder="e.g. Simons"
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-1.75 px-3 m-2 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
              <label>Price
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price || ""}
                  onChange={e => setDraft({...draft, price: Number(e.target.value)})}
                  placeholder="0.00"
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-1.75 px-3 m-2 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
              <label className="sm:col-span-2">Product Image URL
                <input
                  type="url"
                  value={draft.image_url ?? ""}
                  onChange={e => setDraft({...draft, image_url: e.target.value})}
                  placeholder="https://…"
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-1.75 px-3 m-2 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
              <label className="sm:col-span-2">Product Page URL
                <input
                  type="url"
                  value={draft.product_url ?? ""}
                  onChange={e => setDraft({...draft, product_url: e.target.value})}
                  placeholder="https://…"
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-1.75 px-3 m-2 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
              <label>Preferences
                <input
                  value={draft.preference ?? ""}
                  onChange={e => setDraft({...draft, preference: e.target.value})}
                  placeholder="e.g. Medium, Brown..."
                  className="border border-[#d9d1c4] bg-[#fffdf8] rounded-md py-2.75 px-3 outline-none text-[#273d33] text-[12px] font-light focus:border-[#879987] focus:shadow-[0 0 0 3px rgba(169,181,160,.2)]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                type="button"
                className="border border-[#d5cbbb] bg-transparent rounded-[99px] py-2.5 px-4.5 text-[#59675b] text-[12px]"
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 border border-[#203c32] rounded-[99px] bg-[#203c32] text-[#fff9ee] py-2.75 px-4.75 text-[12px] font-bold transition-all hover:bg-[#315447] hover:translate-u-[-1px]"
                disabled={saving}
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add to wishlist"}
              </button>
            </div>
          </form>
      </div>)}
    </main>
  );
}
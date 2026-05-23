import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";

export function Profile() {
  const user = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await updateProfile({ displayName, bio: bio || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) {
    return <p className="text-stone-400">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-stone-800 bg-[#121218] p-6">
      <h1 className="text-2xl font-semibold text-amber-400">Your profile</h1>
      <p className="text-sm text-stone-500">Rating: {user.rating ?? 1200}</p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-stone-950 hover:bg-amber-500"
        >
          Save changes
        </button>
      </form>
      {saved && <p className="text-sm text-green-400">Profile saved.</p>}
    </div>
  );
}

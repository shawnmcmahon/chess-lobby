import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

export function ProfileSetup() {
  const updateProfile = useMutation(api.users.updateProfile);
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile({ displayName, bio: bio || undefined });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-stone-800 bg-[#121218] p-6">
      <h1 className="text-2xl font-semibold text-amber-400">Create your profile</h1>
      <p className="text-sm text-stone-400">
        Choose a display name so other players can find and challenge you.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio (optional)"
          rows={3}
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-600"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-600 py-2 font-medium text-stone-950 hover:bg-amber-500"
        >
          Save profile
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

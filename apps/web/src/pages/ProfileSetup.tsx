import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { useTheme } from "@/theme/themeContext";
import { AtelierProfileSetup } from "@/theme/atelier/AtelierProfileSetup";
import { BentoProfileSetup } from "@/theme/bento/BentoProfileSetup";
import { BrutalProfileSetup } from "@/theme/brutal/BrutalProfileSetup";
import { DefaultProfileSetup } from "@/theme/default/DefaultProfileSetup";

export function ProfileSetup() {
  const updateProfile = useMutation(api.users.updateProfile);
  const navigate = useNavigate();
  const { theme } = useTheme();
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

  switch (theme) {
    case "atelier":
      return (
        <AtelierProfileSetup
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          bio={bio}
          onBioChange={setBio}
          error={error}
          onSubmit={onSubmit}
        />
      );
    case "bento":
      return (
        <BentoProfileSetup
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          onSubmit={onSubmit}
          error={error}
        />
      );
    case "brutal":
      return (
        <BrutalProfileSetup
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          error={error}
          onSubmit={onSubmit}
        />
      );
    default:
      return (
        <DefaultProfileSetup
          displayName={displayName}
          setDisplayName={setDisplayName}
          bio={bio}
          setBio={setBio}
          onSubmit={onSubmit}
          error={error}
        />
      );
  }
}

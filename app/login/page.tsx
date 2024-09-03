import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = createClient();

  const signInAnonymously = async () => {
    "use server";
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously()

    console.log(error)
    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }
    return redirect("/protected");
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <SubmitButton
          formAction={signInAnonymously}
          className="bg-purple-950 text-white rounded-md px-4 py-2 text-foreground mb-2"
          pendingText="Signing In Anonymously..."
        >
          Sign In Anonymously
        </SubmitButton>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
      </form>
      <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
       
       <p> Cornell University 2024</p>
     </footer>
    </div>
  );
}
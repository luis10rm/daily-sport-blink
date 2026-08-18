import { Navigate, useParams } from "@/lib/router-compat";

export default function RedakcjaRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/autor/${slug ?? ""}`} replace />;
}

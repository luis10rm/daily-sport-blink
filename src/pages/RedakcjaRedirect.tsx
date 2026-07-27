import { Navigate, useParams } from "react-router-dom";

export default function RedakcjaRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/autor/${slug ?? ""}`} replace />;
}

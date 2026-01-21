import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const { user, isAdmin } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Ustawienia</h1>
          <p className="text-muted-foreground">
            Zarządzaj ustawieniami aplikacji
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Twoje konto</CardTitle>
              <CardDescription>Informacje o Twoim koncie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rola</p>
                <p className="text-foreground">
                  {isAdmin ? "Administrator" : "Redaktor"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID użytkownika
                </p>
                <p className="text-foreground font-mono text-sm">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacje o aplikacji</CardTitle>
              <CardDescription>Szczegóły techniczne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wersja</p>
                <p className="text-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Backend
                </p>
                <p className="text-foreground">Lovable Cloud</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;

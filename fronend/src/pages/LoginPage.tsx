import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService, type LoginData } from "@/services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiService.login(formData);
      // Redirect to desk after successful login
      navigate("/desk/campaigns");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center text-sm text-amber-100/70 hover:text-amber-100">
              ← На главную
            </Link>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                Вход
              </p>
              <h1 className="font-display text-4xl text-amber-100">
                Вернись к хроникам.
              </h1>
              <p className="text-lg text-amber-100/70 max-w-lg">
                Управляй кампаниями, добавляй заметки и держи темп сессий.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-700/40 bg-amber-950/60 p-4 text-sm text-amber-100/70">
              <p className="font-medium text-amber-100">Демо-доступ</p>
              <p>Логин: admin</p>
              <p>Пароль: admin12345</p>
            </div>
          </div>

          <Card className="w-full rounded-3xl border-amber-700/40 bg-amber-950/70 shadow-xl shadow-amber-900/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-amber-100 text-center">
                Войти в кабинет
              </CardTitle>
              <CardDescription className="text-center text-amber-100/70">
                Введите логин и пароль, чтобы продолжить.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                    {errors.submit}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Введите логин"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Введите пароль"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Входим..." : "Войти"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Нет аккаунта?{" "}
                  </span>
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Создать
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

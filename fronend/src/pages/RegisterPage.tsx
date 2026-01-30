import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService, type RegisterData } from "@/services/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.password2) {
      newErrors.password2 = "Please confirm your password";
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setErrors({});

    try {
      const response = await apiService.register(formData);
      setSuccessMessage(response.message || "Registration successful!");
      
      // Redirect to desk after a short delay
      setTimeout(() => {
        navigate("/desk/campaigns");
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_440px] gap-10 items-center">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center text-sm text-amber-100/70 hover:text-amber-100">
              ← На главную
            </Link>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-100/60">
                Регистрация
              </p>
              <h1 className="font-display text-4xl text-amber-100">
                Создай стол мастера.
              </h1>
              <p className="text-lg text-amber-100/70 max-w-lg">
                Храни кампании и заметки в одном месте. Начни с демо‑шаблона и
                дополни своими сценами.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "Кампании", desc: "Хронология и арки" },
                { title: "Сессии", desc: "Дата, сцены, итог" },
                { title: "Заметки", desc: "NPC, крючки, детали" },
                { title: "Экспорт", desc: "Быстрый доступ" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-amber-700/40 bg-amber-950/60 p-4 text-sm"
                >
                  <p className="font-medium text-amber-100">{item.title}</p>
                  <p className="text-amber-100/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="w-full rounded-3xl border-amber-700/40 bg-amber-950/70 shadow-xl shadow-amber-900/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-amber-100 text-center">
                Создать аккаунт
              </CardTitle>
              <CardDescription className="text-center text-amber-100/70">
                Заполните поля, чтобы открыть кабинет.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.submit && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                    {errors.submit}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
                    {successMessage}
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
                    placeholder="Придумайте логин"
                    required
                    aria-invalid={!!errors.username}
                    aria-describedby={errors.username ? "username-error" : undefined}
                  />
                  {errors.username && (
                    <p id="username-error" className="text-sm text-red-600">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Не менее 8 символов"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  {errors.password && (
                    <p id="password-error" className="text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password2">Подтверждение пароля</Label>
                  <Input
                    id="password2"
                    name="password2"
                    type="password"
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="Повторите пароль"
                    required
                    aria-invalid={!!errors.password2}
                    aria-describedby={errors.password2 ? "password2-error" : undefined}
                  />
                  {errors.password2 && (
                    <p id="password2-error" className="text-sm text-red-600">
                      {errors.password2}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Создаем..." : "Создать аккаунт"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Уже есть аккаунт?{" "}
                  </span>
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Войти
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

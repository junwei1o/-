import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

/**
 * 找不到頁面。
 *
 * 2026-10-01 全站優化修正兩件事：
 * 1. **文案原本是全英文**（"Page Not Found" / "Go Home"），與全站繁體中文不一致，
 *    對國小 3–6 年級的目標使用者尤其不友善 → 改為繁體中文。
 * 2. **原本硬編碼 Tailwind 色票**（`bg-blue-600`、`text-red-500`、`from-slate-50`），
 *    違反本專案 index.css 開頭明訂的「不得寫死色碼，一律引用設計變數」規範，
 *    也吃不到既有主題與對比度治理 → 改用語意色（primary／foreground／card）。
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-card backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

          <h2 className="text-xl font-semibold text-foreground mb-4">找不到這個頁面</h2>

          <p className="text-foreground/75 mb-8 leading-relaxed">
            你要找的頁面不存在，可能已經被移動或刪除。
            <br />
            回到航海儀表板，繼續你的學習航線吧。
          </p>

          <div id="not-found-button-group" className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoHome} className="min-h-11 px-6">
              <Home className="w-4 h-4 mr-2" />
              回到首頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

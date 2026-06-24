import { useAdminLogin } from "../hooks/useAdminLogin";
import { useDynamicLogo } from "../../../../hooks/useDynamicLogo";

/**
 * AdminLoginPage (AUTH)
 * - UI: replica el AdminLogin original (mismo layout/markup/clases)
 * - Lógica: centralizada en useAdminLogin (auth/admin/hooks)
 */
export default function AdminLoginPage({ onLoginSuccess }) {
  const s = useAdminLogin({ onLoginSuccess });
  const { logoUrl } = useDynamicLogo({ idElemento: 1 });

  return (
    <div className="min-h-screen flex w-full font-display antialiased text-slate-800 bg-background-light dark:bg-background-dark">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-primary/5">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center grayscale-[30%] sepia-[10%]"
          data-alt="Close up of diverse hands holding together in a circle representing community support and solidarity"
          style={{ backgroundImage: `url('${s.bgUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1215]/90 via-[#742f38]/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-16 w-full h-full text-white">
          <div className="max-w-lg">
            <span className="material-symbols-outlined text-4xl mb-6 opacity-90">
              psychology
            </span>
            <blockquote className="text-3xl font-medium leading-tight mb-4 tracking-tight">
              "Migrar es un acto de vida, un acto de vida que requiere de la solidaridad"
            </blockquote>
            <p className="text-white/70 font-light text-sm uppercase tracking-widest">
              Corazón de Migrante
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-cream-panel dark:bg-background-dark transition-colors duration-300 relative">
        <div className="absolute top-8 right-8 flex gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            className="hover:text-primary transition-colors"
            onClick={s.openVerifyPinModal}
          >
            Verificar PIN
          </button>
        </div>

        <div className="w-full max-w-[420px] flex flex-col gap-8">
          {/* Branding */}
          <div className="flex flex-col items-start gap-6">
            <div
              className="flex items-center gap-3 text-primary dark:text-white"
              style={{ display: "flex", alignItems: "center", justifyContent: "start", width: "100%" }}
            >
              <img
                src={logoUrl}
                alt="Logo Corazón Migrante"
                className="w-10 h-10 object-contain"
                style={{ borderRadius: "50%" }}
              />
              <span className="text-xl font-bold tracking-tight text-primary dark:text-white">
                Corazón de Migrante
              </span>
            </div>

            <div
              className="space-y-2 mt-4"
              style={{ display: "flex", flexDirection: "column", alignItems: "start", justifyContent: "center", width: "100%" }}
            >
              <h1 className="text-3xl font-bold text-[#181112] dark:text-white tracking-tight">
                Portal Administrativo
              </h1>
              <p
                className="text-[#865f64] dark:text-gray-400 text-base font-normal"
                style={{ textAlign: "start" }}
              >
                Bienvenido de nuevo. Ingresa tus credenciales para acceder al panel.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="relative">
            {s.isSuccess && (
              <div className="absolute inset-0 z-10 bg-white/90 dark:bg-[#1e1e1e]/90 flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4 animate-in zoom-in-50 duration-500 ease-out-back">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-6xl shadow-sm">
                    check_circle
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 animate-in slide-in-from-bottom-2 duration-700 delay-100">
                  ¡Bienvenido!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                  Redireccionando...
                </p>
              </div>
            )}

            <form
              className={`flex flex-col gap-5 mt-2 transition-opacity duration-300 ${
                s.isSuccess ? "opacity-0 invisible" : "opacity-100"
              }`}
              onSubmit={s.handleSubmit}
            >
              {s.errorMessage && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                  {s.errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-[#181112] dark:text-gray-200 text-sm font-semibold block"
                    htmlFor="email"
                    style={{ display: "flex", alignItems: "start", justifyContent: "start", width: "100%" }}
                  >
                    Correo Electrónico
                  </label>
                  {s.emailError && (
                    <span
                      className="text-red-500 w-64 text-xs font-semibold animate-pulse text-right"
                      style={{ display: "flex", alignItems: "center", justifyContent: "end", width: "100%" }}
                    >
                      {s.emailError}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="email"
                    className={`w-full bg-white dark:bg-white/5 border ${
                      s.emailError
                        ? "border-red-500"
                        : "border-gray-200 dark:border-white/10"
                    } rounded-lg h-12 px-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm`}
                    placeholder="nombre@fundacion.org"
                    type="email"
                    value={s.email}
                    onChange={(e) => s.setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={s.isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-[#181112] dark:text-gray-200 text-sm font-semibold block"
                    htmlFor="password"
                    style={{ display: "flex", alignItems: "start", justifyContent: "start", width: "100%" }}
                  >
                    Contraseña
                  </label>
                  {s.passwordError && (
                    <span className="text-red-500 w-64 text-xs font-semibold animate-pulse text-right">
                      {s.passwordError}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="password"
                    className={`w-full bg-white dark:bg-white/5 border ${
                      s.passwordError
                        ? "border-red-500"
                        : "border-gray-200 dark:border-white/10"
                    } rounded-lg h-12 px-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm`}
                    placeholder="••••••••"
                    type={s.showPassword ? "text" : "password"}
                    value={s.password}
                    onChange={(e) => s.setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={s.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => s.setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={s.showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {s.showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:bg-primary checked:border-primary transition-all"
                      type="checkbox"
                      checked={s.remember}
                      onChange={(e) => s.setRemember(e.target.checked)}
                      disabled={s.isLoading}
                    />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        />
                      </svg>
                    </span>
                  </div>

                  <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                    Recordarme
                  </span>
                </label>

                <button
                  type="button"
                  onClick={s.openForgotModal}
                  className="text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                  disabled={s.isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-12 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mt-4 group"
                type="submit"
                disabled={s.isLoading}
              >
                {s.isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <>
                    <span>Entrar al Portal</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-200 dark:border-white/10 pt-6">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                © 2025 Corazón de Migrante. Todos los derechos reservados.
                <br />
                <span className="mt-1 block">
                  Acceso restringido únicamente a personal autorizado.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {s.isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recuperar Contraseña
                </h3>
                <button
                  onClick={s.closeForgotModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {s.recoveryStep === "email" && (
                <>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                    Ingresa tu correo electronico de usuario:
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      s.requestPin();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                          Correo Electrónico
                        </label>
                        {s.forgotError && (
                          <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                            {s.forgotError}
                          </span>
                        )}
                      </div>

                      <input
                        type="email"
                        required
                        className={`w-full bg-slate-50 dark:bg-white/5 border ${
                          s.forgotError
                            ? "border-red-500"
                            : "border-slate-200 dark:border-white/10"
                        } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="ejemplo@correo.com"
                        value={s.forgotEmail}
                        onChange={(e) => {
                          s.setForgotEmail(e.target.value);
                        }}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={s.forgotLoading}
                        className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {s.forgotLoading ? "Enviando..." : "Enviar correo"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {s.recoveryStep === "pin" && (
                <>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                    Ingresa el PIN enviado por correo:
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      s.verifyPin();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                          Código PIN
                        </label>
                        {s.forgotError && (
                          <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                            {s.forgotError}
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        className={`w-full bg-slate-50 dark:bg-white/5 border ${
                          s.forgotError
                            ? "border-red-500"
                            : "border-slate-200 dark:border-white/10"
                        } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-widest text-center text-lg font-mono`}
                        placeholder="000000"
                        value={s.recoveryPin}
                        onChange={(e) => s.setRecoveryPin(e.target.value)}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={s.forgotLoading}
                        className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {s.forgotLoading ? "Verificando..." : "Verificar"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {s.recoveryStep === "password" && (
                <>
                  <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                    Ingresa tu nueva contraseña:
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      s.resetPassword();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                          Nueva contraseña
                        </label>
                        {s.resetError && (
                          <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                            {s.resetError}
                          </span>
                        )}
                      </div>

                      <input
                        type="password"
                        required
                        className={`w-full bg-slate-50 dark:bg-white/5 border ${
                          s.resetError
                            ? "border-red-500"
                            : "border-slate-200 dark:border-white/10"
                        } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="••••••••"
                        value={s.newPassword}
                        onChange={(e) => s.setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                        Repetir contraseña
                      </label>

                      <input
                        type="password"
                        required
                        className={`w-full bg-slate-50 dark:bg-white/5 border ${
                          s.resetError
                            ? "border-red-500"
                            : "border-slate-200 dark:border-white/10"
                        } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                        placeholder="••••••••"
                        value={s.newPassword2}
                        onChange={(e) => s.setNewPassword2(e.target.value)}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={s.forgotLoading}
                        className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {s.forgotLoading ? "Actualizando..." : "Actualizar contraseña"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

{/* Verify PIN Modal */}
      {s.isVerifyPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verificar PIN
                </h3>
                <button
                  onClick={s.closeVerifyPinModal}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                Ingresa tu correo y el PIN para activar tu cuenta.
              </p>

              {s.requestNewPinOkMessage && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">mark_email_read</span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {s.requestNewPinOkMessage}
                      </p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                        Revisa tu correo e ingresa el nuevo PIN para verificar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {s.requestNewPinError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        {s.requestNewPinError}
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {s.verifyOkMessage ? (
                <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        {s.verifyOkMessage}
                      </p>
                      <p className="text-xs text-green-700/80 dark:text-green-300/80">
                        Ya puedes iniciar sesión.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={s.closeVerifyPinModal}
                      className="w-full bg-primary hover:bg-[#5e262d] text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    s.verifyRegistroPin();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                        Correo Electrónico
                      </label>
                      {s.verifyError && (
                        <span className="text-red-500 text-xs font-semibold animate-pulse text-right">
                          {s.verifyError}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      required
                      className={`w-full bg-slate-50 dark:bg-white/5 border ${
                        s.verifyError
                          ? "border-red-500"
                          : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
                      placeholder="ejemplo@correo.com"
                      value={s.verifyEmail}
                      onChange={(e) => s.setVerifyEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold block">
                      Código PIN
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full bg-slate-50 dark:bg-white/5 border ${
                        s.verifyError
                          ? "border-red-500"
                          : "border-slate-200 dark:border-white/10"
                      } rounded-lg h-11 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-widest text-center text-lg font-mono`}
                      placeholder="000000"
                      value={s.verifyPinCode}
                      onChange={(e) => s.setVerifyPinCode(e.target.value)}
                    />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={s.requestNewAuthPin}
                      disabled={s.requestNewPinLoading || !String(s.verifyEmail || '').trim()}
                      className="text-sm font-semibold text-primary hover:text-[#5e262d] disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {s.requestNewPinLoading ? 'Solicitando...' : 'Solicitar nuevo PIN'}
                    </button>
                  </div>

                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={s.verifyLoading}
                      className="w-full bg-primary hover:bg-[#5e262d] disabled:bg-primary/70 disabled:cursor-not-allowed text-white font-semibold h-11 rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {s.verifyLoading ? "Verificando..." : "Verificar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import {
  LanguageProvider,
  useLanguage,
  type Locale,
} from "./context/LanguageContext";

import { AuthProvider, useAuth } from "./context/AuthContext";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardAdminPage } from "./pages/DashboardAdminPage";
import { DashboardScholarAdminPage } from "./pages/DashboardScholarAdminPage";
import { DashboardTeacherPage } from "./pages/DashboardTeacherPage";
import { DashboardStudentsPage } from "./pages/DashboardStudentsPage";
import { KitchenPage } from "./pages/KitchenPage";

import { SchoolsPage } from "./pages/SchoolsPage";
import { SchoolDetailsPage } from "./pages/SchoolDetailsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { UsersPage } from "./pages/UsersPage";
import { StudentsBulkUploadPage } from "./pages/StudentsBulkUploadPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { PaymentsFinancePage } from "./pages/PaymentsFinancePage/PaymentsFinancePage";
import { PaymentDetailPage } from "./pages/PaymentsFinancePage/PaymentDetailPage";
import { PaymentRequestDetailPage } from "./pages/PaymentsFinancePage/PaymentRequestDetailPage";
import { PaymentRequestUploadResultPage } from "./pages/PaymentsFinancePage/PaymentRequestUploadResultPage";
import { PaymentRequestScheduledDetailPage } from "./pages/PaymentsFinancePage/PaymentRequestScheduledDetailPage";
import { GlobalSettingsPage } from "./pages/GlobalSettingsPage";
import { PointOfSalePage } from "./pages/PointOfSalePage";
import { PointOfSaleMenuPage } from "./pages/PointOfSaleMenuPage";

import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { Layout } from "./layout/Layout";

function getPathLocale(path: string): Locale | null {
  const match = path.match(/^\/(es|en)(?:\/|$)/);
  return match ? (match[1] as Locale) : null;
}

function Router() {
  const [path, setPath] = useState(window.location.pathname);

  const { token, role, hydrated } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  const localeRef = useRef(locale);
  const pathLocale = useMemo(() => getPathLocale(path), [path]);

  // ---------------------------
  // Navigation helper
  // ---------------------------
  const navigate = useCallback((nextPath: string) => {
    if (window.location.pathname === nextPath) return;
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }, []);

  // ---------------------------
  // popstate listener
  // ---------------------------
  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // ------------------------------------------------------
  // SYNC LOCALE WITH URL
  // ------------------------------------------------------
  useEffect(() => {
    if (pathLocale && pathLocale !== locale) {
      setLocale(pathLocale);
    }
  }, [pathLocale, locale, setLocale]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  // ------------------------------------------------------
  // FORCE URL TO ALWAYS INCLUDE LOCALE PREFIX
  // ------------------------------------------------------
  useEffect(() => {
    if (!pathLocale) {
      Promise.resolve().then(() => navigate(`/${locale}${path}`));
    }
  }, [path, pathLocale, locale, navigate]);

  // ------------------------------------------------------
  // LOGIN / LOGOUT ROUTING
  // ------------------------------------------------------
  const isLoginPath =
    path === "/login" || /^\/(es|en)\/login$/.test(path);

  useEffect(() => {
    if (!hydrated) return;

    if (!token && !isLoginPath) {
      Promise.resolve().then(() => navigate(`/${locale}/login`));
    }
  }, [hydrated, token, isLoginPath, navigate, locale]);

  useEffect(() => {
    if (!hydrated) return;

    if (token && isLoginPath) {
      Promise.resolve().then(() => navigate(`/${locale}`));
    }
  }, [hydrated, token, isLoginPath, navigate, locale]);

  // ------------------------------------------------------
  // ROUTING DEFINITIONS (sin dashboard/)
  // ------------------------------------------------------
  const isRootPath = /^\/(es|en)$/.test(path);
  const isSchoolsPath = /^\/(es|en)\/schools$/.test(path);
  const schoolDetailMatch = path.match(/^\/(es|en)\/schools\/(\d+)$/);
  const isSchoolDetailPath = Boolean(schoolDetailMatch);
  const isStudentsPath = /^\/(es|en)\/students&Classes$/.test(path);
  const isStudentsBulkPath = /^\/(es|en)\/students&Classes\/bulk-upload$/.test(path);
  const studentDetailMatch = path.match(/^\/(es|en)\/students&Classes\/students\/(\d+)$/);
  const isStudentDetailPath = Boolean(studentDetailMatch);
  const isUsersPath = /^\/(es|en)\/users$/.test(path);
  const isControlAccessPath = /^\/(es|en)\/control-access$/.test(path);
  const isGlobalSettingsPath = /^\/(es|en)\/globalSetings$/.test(path);
  const isPointOfSalePath = /^\/(es|en)\/point-of-sale$/.test(path);
  const isPointOfSaleMenuPath = /^\/(es|en)\/point-of-sale\/menu$/.test(path);
  const scheduledFinanceMatch = path.match(/^\/(es|en)\/finance\/request\/scheduled\/(\d+)$/);
  const financeMatch = path.match(
    /^\/(es|en)\/finance(?:\/(payments|request|request-upload|kitchen-sales|balance-recharges)(?:\/(\d+))?)?$/,
  );
  const isFinancePath = Boolean(financeMatch) || Boolean(scheduledFinanceMatch);
  const financeSection = financeMatch?.[2];
  const financeEntityId = financeMatch?.[3];

  // ------------------------------------------------------
  // LOADING
  // ------------------------------------------------------
  if (isLoginPath) {
    return <LoginPage onNavigate={navigate} />;
  }

  if (!hydrated) {
    return (
      <Layout onNavigate={navigate} pageTitle={t("portalTitle")}>
        <LoadingSkeleton variant="dashboard" cardCount={8} />
      </Layout>
    );
  }

  // ------------------------------------------------------
  // AUTHENTICATED ROUTES
  // ------------------------------------------------------
  if (token) {
    if (isSchoolDetailPath && schoolDetailMatch) {
      return (
        <SchoolDetailsPage
          onNavigate={navigate}
          schoolId={Number(schoolDetailMatch[2])}
        />
      );
    }

    if (isStudentsBulkPath) {
      return <StudentsBulkUploadPage onNavigate={navigate} />;
    }

    if (isStudentDetailPath && studentDetailMatch) {
      return (
        <StudentDetailPage
          onNavigate={navigate}
          studentId={Number(studentDetailMatch[2])}
        />
      );
    }

    if (isSchoolsPath) return <SchoolsPage onNavigate={navigate} />;
    if (isStudentsPath) return <StudentsPage onNavigate={navigate} />;
    if (isUsersPath) return <UsersPage onNavigate={navigate} />;
    if (scheduledFinanceMatch) {
      return (
        <PaymentRequestScheduledDetailPage
          onNavigate={navigate}
          paymentRequestScheduledId={Number(scheduledFinanceMatch[2])}
        />
      );
    }
    if (isFinancePath && financeSection === 'payments' && financeEntityId) {
      return (
        <PaymentDetailPage
          onNavigate={navigate}
          paymentId={Number(financeEntityId)}
        />
      );
    }

    if (isFinancePath && financeSection === 'request' && financeEntityId) {
      return (
        <PaymentRequestDetailPage
          onNavigate={navigate}
          paymentRequestId={Number(financeEntityId)}
        />
      );
    }

    if (isFinancePath && financeSection === 'request-upload' && financeEntityId) {
      return (
        <PaymentRequestUploadResultPage
          onNavigate={navigate}
          massUploadId={Number(financeEntityId)}
        />
      );
    }

    if (isFinancePath) return <PaymentsFinancePage onNavigate={navigate} currentPath={path} />;
    if (isGlobalSettingsPath) return <GlobalSettingsPage onNavigate={navigate} />;
    if (isControlAccessPath) return <GlobalSettingsPage onNavigate={navigate} initialTab="roles" />;
    if (isPointOfSaleMenuPath) return <PointOfSaleMenuPage onNavigate={navigate} />;
    if (isPointOfSalePath) return <PointOfSalePage onNavigate={navigate} />;

    if (isRootPath) {
      switch (role) {
        case "ADMIN":
          return <DashboardAdminPage onNavigate={navigate} />;
        case "SCHOOL_ADMIN" :
        case "UNKNOWN" :
          return <DashboardScholarAdminPage onNavigate={navigate} />;
        case "TEACHER":
          return <DashboardTeacherPage onNavigate={navigate} />;
        case "STUDENT":
          return <DashboardStudentsPage onNavigate={navigate} />;
        case "KITCHEN":
          return <KitchenPage onNavigate={navigate} />;
        default:
          return <HomePage onNavigate={navigate} />;
      }
    }

    // Default
    return <HomePage onNavigate={navigate} />;
  }

  // ------------------------------------------------------
  // PUBLIC ROUTES
  // ------------------------------------------------------
  return <HomePage onNavigate={navigate} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </LanguageProvider>
  );
}

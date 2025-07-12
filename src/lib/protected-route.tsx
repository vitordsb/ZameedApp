
import React from "react";
import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  adminOnly?: boolean;
  guestAllowed?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  path,
  adminOnly = false,
  guestAllowed = false,
  ...rest
}) => {
  const { isLoggedIn, isGuest, user } = useAuth();

  // se não é usuário nem convidado, manda pra /auth
  if (!isLoggedIn && !(guestAllowed && isGuest)) {
    return <Redirect to="/auth" />;
  }

  // se estiver protegido só pra admin mas não for admin, joga pra /
  if (adminOnly && user?.userType !== "admin") {
    return <Redirect to="/home" />;
  }

  return <Route path={path} component={Component} {...rest} />;
};


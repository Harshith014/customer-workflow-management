import "./globals.css";

import {
  AuthProvider,
} from "../context/AuthContext";

export const metadata = {
  title:
    "Application Management System",
  description:
    "Customer application processing system",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
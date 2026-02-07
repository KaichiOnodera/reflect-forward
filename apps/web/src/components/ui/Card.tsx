"use client";

import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-lg bg-white shadow-md p-8 ${className}`} {...props}>
      {children}
    </div>
  );
}

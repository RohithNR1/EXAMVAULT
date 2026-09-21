/**
 * Card — reusable surface card with optional header and footer slots.
 *
 * Composition example:
 *   <Card>
 *     <Card.Header>Title</Card.Header>
 *     <Card.Body>Content</Card.Body>
 *     <Card.Footer>Actions</Card.Footer>
 *   </Card>
 */
import React from "react";

function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "bg-surface border border-neutral-200 rounded-xl shadow-soft",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

function Header({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "px-5 py-4 border-b border-neutral-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

function Body({ className = "", children, ...rest }) {
  return (
    <div className={["px-5 py-4", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

function Footer({ className = "", children, ...rest }) {
  return (
    <div
      className={[
        "px-5 py-4 border-t border-neutral-200 bg-neutral-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;

export default Card;

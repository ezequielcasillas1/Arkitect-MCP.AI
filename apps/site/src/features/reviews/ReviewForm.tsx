import { useId, useState, type FormEvent } from "react";
import type { SubmitReviewInput } from "./types";

interface ReviewFormProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmit: (input: SubmitReviewInput) => Promise<boolean>;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function ReviewForm({ isSubmitting, errorMessage, successMessage, onSubmit }: ReviewFormProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const nameId = useId();
  const messageId = useId();
  const statusId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (honeypot) {
      return;
    }

    const success = await onSubmit({ name, rating, message });
    if (success) {
      setName("");
      setRating(5);
      setMessage("");
    }
  };

  return (
    <form className="form-stack review-form" onSubmit={handleSubmit} aria-describedby={statusId}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="arkitect-review-company">Company (leave blank)</label>
        <input
          id="arkitect-review-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <label htmlFor={nameId}>
        Your name
        <input
          id={nameId}
          name="name"
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </label>

      <fieldset className="review-rating-fieldset">
        <legend>Rating</legend>
        <div className="review-rating-options" role="radiogroup" aria-label="Rating out of 5">
          {RATING_OPTIONS.map((value) => (
            <label key={value} className="review-rating-option">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
              />
              <span aria-hidden="true">{"★".repeat(value)}</span>
              <span className="visually-hidden">{value} out of 5 stars</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={messageId}>
        Your review
        <textarea
          id={messageId}
          name="message"
          required
          maxLength={1000}
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <button type="submit" className="primary-button action-button-wide" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>

      <div id={statusId} role="status" aria-live="polite" className="review-form-status">
        {errorMessage ? <span className="counter-error">{errorMessage}</span> : null}
        {successMessage ? <span className="review-success">{successMessage}</span> : null}
      </div>
    </form>
  );
}

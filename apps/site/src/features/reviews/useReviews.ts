import { useCallback, useEffect, useRef, useState } from "react";
import { getOrCreateVisitorId } from "../../lib/visitor-id";
import { withPendingGuard } from "../../lib/with-pending-guard";
import { reviewsGateway } from "./data-access";
import type { Review, SubmitReviewInput } from "./types";

type Status = "loading" | "ready" | "submitting" | "error";

interface ReviewsState {
  status: Status;
  reviews: Review[];
  loadError: string | null;
  submitError: string | null;
  successMessage: string | null;
  submit: (input: SubmitReviewInput) => Promise<boolean>;
}

export function useReviews(): ReviewsState {
  const [status, setStatus] = useState<Status>("loading");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const guardedSubmitRef = useRef(withPendingGuard(reviewsGateway.submitReview));

  useEffect(() => {
    let cancelled = false;

    reviewsGateway
      .listReviews()
      .then((result) => {
        if (!cancelled) {
          setReviews(result);
          setLoadError(null);
          setStatus("ready");
        }
      })
      .catch((error: unknown) => {
        console.error("[reviews] listReviews failed:", error);
        if (!cancelled) {
          setLoadError("Could not load reviews right now. Please refresh to try again.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(async (input: SubmitReviewInput) => {
    setStatus("submitting");
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const visitorId = getOrCreateVisitorId();
      const created = await guardedSubmitRef.current(input, visitorId);
      setReviews((current) => [created, ...current]);
      setLoadError(null);
      setSuccessMessage("Thanks for the feedback — your review is live.");
      setStatus("ready");
      return true;
    } catch (error) {
      console.error("[reviews] submitReview failed:", error);
      setSubmitError(error instanceof Error ? error.message : "Could not submit your review.");
      setStatus("ready");
      return false;
    }
  }, []);

  return { status, reviews, loadError, submitError, successMessage, submit };
}

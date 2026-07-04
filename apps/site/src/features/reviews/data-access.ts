import { getSupabaseClient } from "../../lib/supabaseClient";
import { isSupabaseConfigured } from "../../lib/env";
import type { Review, SubmitReviewInput } from "./types";

const MOCK_STORAGE_KEY = "arkitect_mock_reviews";
const NAME_MAX = 80;
const MESSAGE_MAX = 1000;

const SEED_REVIEWS: Review[] = [
  {
    id: "seed-1",
    name: "Priya S.",
    rating: 5,
    message: "The diagnosis-first flow saved us from a rewrite we didn't actually need.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: "seed-2",
    name: "Marcus T.",
    rating: 4,
    message: "Love the vertical-slice guidance. Would like more remix profiles for event-driven work.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

/**
 * Repository contract for the reviews slice — components only ever depend
 * on this interface, never on Supabase or localStorage directly.
 */
export interface ReviewsGateway {
  listReviews(): Promise<Review[]>;
  submitReview(input: SubmitReviewInput, visitorId: string): Promise<Review>;
}

function validateInput(input: SubmitReviewInput): void {
  const trimmedName = input.name.trim();
  const trimmedMessage = input.message.trim();

  if (trimmedName.length < 1 || trimmedName.length > NAME_MAX) {
    throw new Error(`Name must be between 1 and ${NAME_MAX} characters.`);
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be a whole number between 1 and 5.");
  }
  if (trimmedMessage.length < 1 || trimmedMessage.length > MESSAGE_MAX) {
    throw new Error(`Review must be between 1 and ${MESSAGE_MAX} characters.`);
  }
}

function readMockReviews(): Review[] {
  if (typeof window === "undefined") {
    return SEED_REVIEWS;
  }

  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
  if (!raw) {
    return SEED_REVIEWS;
  }

  try {
    const parsed = JSON.parse(raw) as Review[];
    return Array.isArray(parsed) ? parsed : SEED_REVIEWS;
  } catch {
    return SEED_REVIEWS;
  }
}

function writeMockReviews(reviews: Review[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(reviews));
}

function createMockReviewsGateway(): ReviewsGateway {
  return {
    async listReviews() {
      return [...readMockReviews()].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    async submitReview(input: SubmitReviewInput) {
      validateInput(input);

      const review: Review = {
        id: crypto.randomUUID?.() ?? `mock-${Date.now()}`,
        name: input.name.trim(),
        rating: input.rating,
        message: input.message.trim(),
        createdAt: new Date().toISOString()
      };

      const next = [review, ...readMockReviews()];
      writeMockReviews(next);
      return review;
    }
  };
}

interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  message: string;
  created_at: string;
}

function fromRow(row: ReviewRow): Review {
  return { id: row.id, name: row.name, rating: row.rating, message: row.message, createdAt: row.created_at };
}

function createSupabaseReviewsGateway(): ReviewsGateway {
  return {
    async listReviews() {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const { data, error } = await client
        .from("arkitect_reviews")
        .select("id, name, rating, message, created_at")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(error.message);
      }

      return ((data ?? []) as ReviewRow[]).map(fromRow);
    },
    async submitReview(input: SubmitReviewInput, visitorId: string) {
      validateInput(input);

      const client = getSupabaseClient();
      if (!client) {
        throw new Error("supabase_not_configured");
      }

      const { data, error } = await client
        .from("arkitect_reviews")
        .insert({
          name: input.name.trim(),
          rating: input.rating,
          message: input.message.trim(),
          visitor_id: visitorId
        })
        .select("id, name, rating, message, created_at")
        .single();

      if (error || !data) {
        if (error?.message?.includes("review_rate_limited")) {
          throw new Error("You've submitted a few reviews recently — please try again later.");
        }
        throw new Error(error?.message ?? "submit_failed");
      }

      return fromRow(data as ReviewRow);
    }
  };
}

export const reviewsGateway: ReviewsGateway = isSupabaseConfigured
  ? createSupabaseReviewsGateway()
  : createMockReviewsGateway();

export interface Review {
  id: string;
  name: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface SubmitReviewInput {
  name: string;
  rating: number;
  message: string;
}

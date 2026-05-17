-- Backfill review_deletion_requests from reviews table
INSERT INTO public.review_deletion_requests (review_id, reason, status, created_at)
SELECT 
    review_id, 
    'Backfilled from existing deletion_requested flag' as reason, 
    'Pending' as status,
    NOW() as created_at
FROM public.reviews
WHERE deletion_requested = true
ON CONFLICT (review_id) DO NOTHING;

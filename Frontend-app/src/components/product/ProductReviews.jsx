import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import useReviewStore from '../store/reviewStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ProductReviews = ({ productId }) => {
  const {
    reviews,
    reviewStats,
    canReview,
    loading,
    submitting,
    hasMore,
    currentPage,
    fetchProductReviews,
    fetchReviewStats,
    checkCanReview,
    createReview,
    markHelpful
  } = useReviewStore();
  
  const { isAuthenticated } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    images: []
  });

  useEffect(() => {
    fetchProductReviews(productId);
    fetchReviewStats(productId);
    if (isAuthenticated) {
      checkCanReview(productId);
    }
  }, [productId, isAuthenticated]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    const result = await createReview({
      product: productId,
      ...reviewForm
    });

    if (result.success) {
      setReviewForm({ rating: 5, comment: '', images: [] });
      setShowReviewForm(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }
    await markHelpful(reviewId);
  };

  const loadMoreReviews = () => {
    fetchProductReviews(productId, currentPage + 1);
  };

  if (loading && reviews.length === 0) {
    return <div className="flex justify-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="product-reviews">
      {/* Review Header with Stats */}
      <div className="reviews-header">
        {reviewStats && (
          <div className="review-stats flex flex-col md:flex-row gap-8 mb-6">
            <div className="average-rating text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  {reviewStats.averageRating || 0}
                </span>
                <span className="text-xl text-gray-600">/5</span>
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={20}
                    className={`${
                      star <= Math.round(reviewStats.averageRating || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                ({reviewStats.totalReviews || 0} reviews)
              </span>
            </div>
            
            {/* Rating Distribution */}
            {reviewStats.ratingDistribution && (
              <div className="rating-distribution flex-1">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="rating-bar flex items-center gap-3 mb-2">
                    <span className="w-8 text-sm text-gray-600">{rating} ★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ 
                          width: `${((reviewStats.ratingDistribution[rating] || 0) / (reviewStats.totalReviews || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="w-12 text-sm text-gray-600">
                      ({reviewStats.ratingDistribution[rating] || 0})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Write Review Button */}
      {isAuthenticated && canReview?.canReview && (
        <button 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mb-6 disabled:opacity-50"
          onClick={() => setShowReviewForm(true)}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Write a Review'}
        </button>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Write Your Review</h3>
            <form onSubmit={handleSubmitReview}>
              {/* Star Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rating:</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`text-2xl ${
                        star <= reviewForm.rating 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      } hover:text-yellow-500`}
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Review:</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  placeholder="Share your experience with this product..."
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button 
                  type="button" 
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => setShowReviewForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {reviews.map(review => (
                <ReviewCard 
                  key={review._id} 
                  review={review} 
                  onHelpful={handleHelpful}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center mt-8">
                <button 
                  onClick={loadMoreReviews} 
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Individual Review Card Component
const ReviewCard = ({ review, onHelpful }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <span className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</span>
          {review.isVerifiedPurchase && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              ✓ Verified Purchase
            </span>
          )}
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={16}
                className={`${
                  star <= review.rating 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="review-content">
        <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
        
        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-4">
            {review.images.map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt="Review" 
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}
      </div>

      <div className="review-actions">
        <button 
          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
          onClick={() => onHelpful(review._id)}
        >
          <ThumbsUp size={16} />
          <span>Helpful ({review.helpfulCount || 0})</span>
        </button>
      </div>
    </div>
  );
};

export default ProductReviews;
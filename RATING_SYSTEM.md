# Rating System Documentation

## Overview
The rating system allows both owners and renters to rate each other after a completed booking. This builds trust and accountability in the platform.

## How It Works

### 1. Booking Completion
- When a booking status changes to "completed", both parties receive notifications prompting them to rate their experience
- Each party can only rate once per booking
- Ratings can only be submitted for completed bookings

### 2. Rating Process
- Rating scale: 1-5 stars
- Optional comment/review text
- Both owner and renter can rate independently
- Ratings are tracked separately (ownerRated, renterRated flags in booking)

### 3. User Rating Statistics
Each user account tracks:
- `averageRating`: Overall average rating (0-5)
- `totalRatings`: Total number of ratings received
- `ratingsAsOwner`: Number of ratings received when acting as owner
- `ratingsAsRenter`: Number of ratings received when acting as renter

### 4. Rating Display
- User profiles show average rating and total count
- Individual ratings can be viewed with comments
- Ratings are associated with specific bookings and trailers

## API Endpoints

### Create Rating
```
POST /api/rating/create
Body: {
  bookingId: "booking_id",
  reviewerId: "user_id",
  rating: 5,
  comment: "Great experience!"
}
```

### Get User Ratings
```
GET /api/rating/user/:userId?type=received
GET /api/rating/user/:userId?type=given
```

### Get Trailer Ratings
```
GET /api/rating/trailer/:trailerId
```

### Check If User Can Rate
```
GET /api/rating/can-rate/:bookingId/:userId
```

## Database Schema

### Rating Model
- bookingId: Reference to booking
- reviewerId: User who gave the rating
- revieweeId: User who received the rating
- trailerId: Trailer involved in the booking
- rating: 1-5 stars
- comment: Optional text review
- reviewerType: "owner" or "renter"
- createdAt: Timestamp

### Account Model Updates
Added fields:
- averageRating: Number (default: 0)
- totalRatings: Number (default: 0)
- ratingsAsOwner: Number (default: 0)
- ratingsAsRenter: Number (default: 0)

### Booking Model Updates
Added fields:
- ownerRated: Boolean (default: false)
- renterRated: Boolean (default: false)

## Frontend Integration

### Display User Rating
```javascript
// Show stars and count
{user.averageRating > 0 ? (
  <div>
    <span>⭐ {user.averageRating.toFixed(1)}</span>
    <span>({user.totalRatings} reviews)</span>
  </div>
) : (
  <span>No ratings yet</span>
)}
```

### Rating Form (After Booking Completion)
1. Check if user can rate: `GET /api/rating/can-rate/:bookingId/:userId`
2. Show rating form if `canRate: true`
3. Submit rating: `POST /api/rating/create`
4. Update UI to show rating submitted

### Show Ratings List
```javascript
// Fetch user's received ratings
fetch(`/api/rating/user/${userId}?type=received`)
  .then(res => res.json())
  .then(data => {
    // Display ratings with reviewer info, stars, and comments
  });
```

## Translation Notes
All user-facing text should be translated:
- "Rate your experience"
- "Please rate the renter"
- "Great experience!"
- "No ratings yet"
- Star labels and descriptions

## Security
- Users can only rate bookings they participated in
- One rating per user per booking
- Ratings cannot be edited (prevents manipulation)
- Booking must be completed before rating

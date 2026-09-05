const mongoose = require('mongoose');

const EventRatingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  eventTitle: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const CategoryRatingSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const FeedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    unique: true
  },
  collegeName: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  // General Symposium Experience Ratings
  foodRating: {
    type: CategoryRatingSchema,
    default: () => ({ rating: null, comment: '' })
  },
  volunteersRating: {
    type: CategoryRatingSchema,
    default: () => ({ rating: null, comment: '' })
  },
  overallRating: {
    type: CategoryRatingSchema,
    default: () => ({ rating: null, comment: '' })
  },
  // Individual Competition Event Ratings
  eventRatings: {
    type: [EventRatingSchema],
    default: []
  }
}, {
  timestamps: true
});

const FeedbackModel = mongoose.model('Feedback', FeedbackSchema);

// Automatically clean up legacy phone_1 unique index in MongoDB if present
const dropLegacyPhoneIndex = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const indexes = await FeedbackModel.collection.indexes();
      const hasPhoneIdx = indexes.some(idx => idx.name === 'phone_1' || (idx.key && idx.key.phone));
      if (hasPhoneIdx) {
        await FeedbackModel.collection.dropIndex('phone_1');
        console.log('✅ Successfully dropped legacy phone_1 index from feedbacks collection.');
      }
    }
  } catch (err) {
    // Ignore if index doesn't exist or collection hasn't been created yet
  }
};

mongoose.connection.on('connected', dropLegacyPhoneIndex);
if (mongoose.connection.readyState === 1) {
  dropLegacyPhoneIndex();
}

module.exports = FeedbackModel;

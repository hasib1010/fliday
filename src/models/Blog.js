import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Please provide a slug'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide an excerpt'],
      trim: true,
      maxlength: [500, 'Excerpt cannot be more than 500 characters'],
    },
    featuredImage: {
      type: String,
      required: [true, 'Please provide a featured image URL'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['eSim', 'Guides', 'Travel', 'Tech', 'News', 'Other'],
      required: [true, 'Please provide a category'],
    },
    content: [
      {
        heading: {
          type: String,
          required: [true, 'Please provide a section heading'],
          trim: true,
          maxlength: [100, 'Heading cannot be more than 100 characters'],
        },
        id: {
          type: String,
          required: [true, 'Please provide a section ID'],
          trim: true,
        },
        content: {
          type: String,
          required: [true, 'Please provide section content'],
        },
      },
    ],
    author: {
      name: {
        type: String,
        required: [true, 'Please provide author name'],
        trim: true,
        maxlength: [50, 'Author name cannot be more than 50 characters'],
      },
      image: {
        type: String,
        required: [true, 'Please provide author image URL'],
        trim: true,
      },
    },
    date: {
      type: Date,
      required: [true, 'Please provide a publication date'],
    },
    readTime: {
      type: String,
      required: [true, 'Please provide estimated read time'],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    relatedArticles: [
      {
        id: {
          type: String,
          required: [true, 'Please provide related article ID'],
        },
        title: {
          type: String,
          required: [true, 'Please provide related article title'],
        },
        image: {
          type: String,
          required: [true, 'Please provide related article image URL'],
        },
        date: {
          type: Date,
          required: [true, 'Please provide related article date'],
        },
        readTime: {
          type: String,
          required: [true, 'Please provide related article read time'],
        },
        author: {
          type: String,
          required: [true, 'Please provide related article author'],
        },
        authorImage: {
          type: String,
          required: [true, 'Please provide related article author image URL'],
        },
        category: {
          type: String,
          enum: ['eSim', 'Guides', 'Travel', 'Tech', 'News', 'Other'],
          required: [true, 'Please provide related article category'],
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the creator'],
    },
  },
  {
    timestamps: true,
  }
);

// Create model if it doesn't exist
const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

export default Blog;
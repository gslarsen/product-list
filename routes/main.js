const router = require('express').Router();
const faker = require('faker');
const Product = require('../models/product');
const Review = require('../models/review');

router.get('/generate-fake-data', (req, res, next) => {
  for (let i = 0; i < 90; i++) {
    let product = new Product()

    product.category = faker.commerce.department()
    product.name = faker.commerce.productName()
    product.price = faker.commerce.price()
    product.image = 'https://www.oysterdiving.com/components/com_easyblog/themes/wireframe/images/placeholder-image.png'

    product.save((err) => {
      if (err) throw err;
    })
  }
  res.end()
});

// // generate a new fake-data review to run once only!
// const fakeReview = new Review({
//   userName: 'gsl',
//   text: 'excellent product!!!',
//   product: "5dc464e40418d9db8d5d688a"
// });

// fakeReview.save();

// Review
//   .findOne({}, (err, res) => {
//     if (err) console.log('Error:', err);
//     else {
//       Product.findById("5dc464e40418d9db8d5d688a", (err, book) => {
//         if (err) console.log('Error finding book:', err);
//         else {
//           console.log('The book before:', book)
//           book.reviews.push(res);
//           book.save();
//           console.log('The book after:', book)
//         }
//       });
//     }
//   });

// Product.findById("5dc464e40418d9db8d5d688a", (err, book) => {
//   if (err) console.log('Error:', err);
//   else { console.log('Book:', book)}
// });


// WORKS Returns the products, 10 per page
router.get('/products', (req, res, next) => {
  const perPage = 10

  // return the first page by default
  const page = req.query.page || 1

  // Look for price and category
  let category = req.query.category;
  const sortByPrice = (req.query.price); // vals are 'lowest' and 'highest'
  
  if (category) {
    category = (req.query.category).charAt(0).toUpperCase() + (req.query.category).substring(1); // ensure query works when first letter not capitalized   
    const products = Product.find( {category: category})
      .skip(perPage * (page - 1))

      // if sort is in query
      if (sortByPrice) {
        if (sortByPrice === 'highest') products.sort({price: -1});
        else products.sort({price: 1});
      }

      products.limit(perPage).exec((err, prods) => {
        Product.countDocuments({category: category}, (err, count) => {
          res.send({totalProducts: count, products: [...prods]});
        });
      });
  } else { // no category in query
    const products = Product.find({})
      .skip(perPage * (page - 1))

    // if sort is in query
    if (sortByPrice) {
      if (sortByPrice === 'highest') products.sort({price: -1});
      else products.sort({price: 1});
    }

    products.limit(perPage).exec((err, prods) => {
      Product.countDocuments({}, (err, count) => {
        res.send({totalProducts: count, products: [...prods]});
      });
    });

  }
});

// WORKS Returns a specific product by its id 
router.get('/products/:product', (req, res, next) => {
  const productId = req.params.product;

  // find product in db
  Product
    .findById(productId, (err, prod) => {
      if (err) throw err;
      else {
        res.send(prod);
      }
    })
});

// WORKS Returns ALL the reviews, but limited to 40 at a time. Reviews collection exists as using references and population methodology
router.get('/reviews', (req, res, next) => {
  const perPage = 40;

  // return the first page by default
  const page = req.query.page || 1

  // Find it
  Review
    .find()
    .skip(perPage * (page - 1))
    .limit(perPage)
    .exec((err, reviews) => {
      // Note that we're not sending `count` back at the moment, but in the future we might want to know how many are coming back
      Product.count().exec((err, count) => {
        if (err) throw err;
        else res.send(reviews);
      })
    })

});

// WORKS Creates a new product in the database
router.post('/products', (req, res, next) => {
  let newProduct = new Product();

  newProduct.category = req.body.category;
  newProduct.name = req.body.name;
  newProduct.price = req.body.price;
  newProduct.image = req.body.image;
  newProduct.reviews = [];

  newProduct.save((err, prod) => {
    if (err) throw err;
    res.send(prod);
  })
});

// WORKS Creates a new review in the database by adding it to the correct product's reviews array
router.post('/:product/reviews', (req, res, next) => {
  const productId = req.params.product;

  // check to see if product is in db
  Product.findById(productId, (err, product) => {
    console.log('Product is:', product);
    if (err) throw err;

    // else create the new review
    const userName = req.body.userName;
    const text = req.body.text;

    const newReview = new Review({
      userName,
      text,
      product: productId
    });

    // save it
    newReview.save(function(err, review){
      if (err) throw err;
      console.log('Review added:', JSON.stringify(review));
    });

    // add to product reviews, save the product and return it to client
    product.reviews.push(newReview);
    product.save((err, prod) => {
      if (err) throw err;
      res.send(prod);
    });
  });
});

// Deletes a product by id
router.delete('/products/:product', (req, res, next) => {
  const productId = req.params.product;

  Product.findByIdAndDelete(productId, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// Deletes a review by id
router.delete('/reviews/:review', (req, res, next) => {
  const reviewId = req.params.review;

  Review.findByIdAndDelete(reviewId, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


module.exports = router
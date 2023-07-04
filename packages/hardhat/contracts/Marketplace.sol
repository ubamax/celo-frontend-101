// SPDX-License-Identifier: MIT

// Version of Solidity compiler this program was written for
pragma solidity >=0.7.0 <0.9.0;

// Contract for the marketplace
contract Marketplace {
    // Keeps track of the number of products in the marketplace
    uint256 internal productsLength = 0;

    // Structure for a product
    struct Product {
        // Address of the product owner
        address payable creator;
        // Address of bid winner
        address payable owner;
        // Name of the product
        string name;
        // Link to an image of the product
        string image;
        // Description of the product
        string description;
        // Location of the product
        string location;
        // highest bidder address
        address payable highestBidder;
        // highest bidder amount
        uint256 highestBid;
        // boolean where the bid is still open
        bool stillOpen;
    }

    // Mapping of products to their index
    mapping(uint256 => Product) internal products;

    // Writes a new product to the marketplace
    function writeProduct(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location
    ) public {
        // address of highest bidder
        address _highestBidder = address(0);
        // amount of highest bidder
        uint256 _highestBid = 0;
        // boolean whether the bid is still open
        bool _stillOpen = true;
        // Adds a new Product struct to the products mapping
        products[productsLength] = Product(
            // Sender's address is set as the owner
            payable(msg.sender),
            payable(address(0)),
            _name,
            _image,
            _description,
            _location,
            payable(_highestBidder),
            _highestBid,
            _stillOpen
        );
        // Increases the number of products in the marketplace by 1
        productsLength++;
    }

    // Reads a product from the marketplace
    function readProduct(
        // Index of the product
        uint256 _index
    )
        public
        view
        returns (Product memory)
    {
        // Returns the details of the product
        return (products[_index]);
    }

    // Place bid on a product
    function placeBid(uint256 productId) public payable {
        Product memory product = products[productId];
        require(product.stillOpen == true, "Product closed already");
        require(msg.value > product.highestBid, "Big amount too low");
        // If nobody has placed a bid before
        if (product.highestBidder == address(0)) {
           // Set the highest bidder and highest bid amount
            products[productId].highestBidder = payable(msg.sender);
            products[productId].highestBid = msg.value; 
            // If someone has placed a bid before
        } else {
            // If it is the highest bidder
            if (product.highestBidder == msg.sender) {
                // increment their bid amount
                products[productId].highestBid += msg.value;
                // If it is a new person
            } else {
                // Transfer the previous highest bidder their amount
                (bool sent,) = product.highestBidder.call{value: product.highestBid}("");
                require(sent, "Failed to send amount to previous highest bidder");
                // Set the highest bidder and highest bid amount
                products[productId].highestBidder = payable(msg.sender);
                products[productId].highestBid = msg.value;
            }
        }
    }

    // Close an open bid
    function closeBid(uint256 productId) public {
        require(products[productId].stillOpen == true, "Product closed already");
        require(msg.sender == products[productId].creator, "Only product creator can close bid");
        require(products[productId].highestBidder != address(0), "Requires at least one bid");
        // Transfer the highest bid amount to the product creator
        (bool sent,) = products[productId].creator.call{value: products[productId].highestBid}("");
        require(sent, "Failed to send bid amount to creator");
        // Update product state
        products[productId].owner = products[productId].highestBidder;
        products[productId].stillOpen = false;
        
    }

    // Returns the number of products in the marketplace
    function getProductsLength() public view returns (uint256) {
        return (productsLength);
    }
}

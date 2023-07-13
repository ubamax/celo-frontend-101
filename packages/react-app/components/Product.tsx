/* eslint-disable @next/next/no-img-element */
// This component displays and enables the purchase of a product

// Importing the dependencies
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
// Import ethers to format the price of the product correctly
import { ethers } from "ethers";
// Import the useConnectModal hook to trigger the wallet connect modal
import { useConnectModal } from "@rainbow-me/rainbowkit";
// Import the useAccount hook to get the user's address
import { useAccount } from "wagmi";
// Import the toast library to display notifications
import { toast } from "react-toastify";
// Import our custom identicon template to display the owner of the product
import { identiconTemplate } from "@/helpers";
// Import our custom hooks to interact with the smart contract
import { useContractCall } from "@/hooks/contract/useContractRead";
import { useContractSend } from "@/hooks/contract/useContractWrite";

// Define the interface for the product, an interface is a type that describes the properties of an object
interface Product {
  creator: string;
  owner: string;
  name: string;
  image: string;
  description: string;
  location: string;
  highestBidder: string;
  highestBid: string;
  stillOpen: boolean;
}

// Define the Product component which takes in the id of the product and some functions to display notifications
const Product = ({ id, setError, setLoading, clear }: any) => {
  const [bidAmount, setBidAmount] = useState<any>(0);

  // Use the useAccount hook to store the user's address
  const { address } = useAccount();
  // Use the useContractCall hook to read the data of the product with the id passed in, from the marketplace contract
  const { data: rawProduct }: any = useContractCall("readProduct", [id], true);
  // Use useContractSend to call placeBid in contract
  const {writeAsync: placeBid} = useContractSend("placeBid", [Number(id)], bidAmount);
  // Use useContractSend to close bid in smart contract
  const {writeAsync: closeBid} = useContractSend("closeBid", [Number(id)]);
  const [product, setProduct] = useState<Product | null>(null);
  // Use the useConnectModal hook to trigger the wallet connect modal
  const { openConnectModal } = useConnectModal();
  // Format the product data that we read from the smart contract
  const getFormatProduct = useCallback(() => {
    if (!rawProduct) return null;
    setProduct({
      creator: rawProduct[0],
      owner: rawProduct[1],
      name: rawProduct[2],
      image: rawProduct[3],
      description: rawProduct[4],
      location: rawProduct[5],
      highestBidder: rawProduct[6],
      highestBid: ethers.utils.formatEther(rawProduct[7]),
      stillOpen: rawProduct[8]
    });
  }, [rawProduct]);

  // Call the getFormatProduct function when the rawProduct state changes
  useEffect(() => {
    getFormatProduct();
  }, [getFormatProduct]);

  // Call the closeBid function to close a bid
  const close = async () => {
    setLoading("Closing bid ...");
    if (Number(product?.highestBidder) == 0) {
      toast("Product must have atleast 1 bid before you can close");
      setLoading(null)
      return;
    }
    try {
      // If the user is not connected, trigger the wallet connect modal
      if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
      // If the user is connected, call the closeBid function and display a notification
      await toast.promise(async () => {
        if (!closeBid) {
          throw "Failed to close bid"
        }
        setLoading("Loading ...");
        const tranxn = await closeBid();
        await tranxn.wait();
      }, {
        pending: "Closing bid...",
        success: "Closed bid successfully",
        error: "Failed to close bid",
      });
    } catch (e: any) {
      console.log({ e });
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
      // Once the purchase is complete, clear the loading state
    } finally {
      setLoading(null);
    }
  }

  // Call the placeBid function to place a bid
  const handleBid = async () => {
    if (!placeBid) {
      throw "Failed to purchase this product";
    }
    setLoading("Bidding...");
    const res = await placeBid();
    // Wait for the transaction to be mined
    await res.wait();
  }

  const bid = async () => {
    setLoading("Placing bid........");
    if (product?.highestBid && (Number(ethers.utils.formatEther(String(bidAmount))) <= Number(product?.highestBid))) {
      toast.warn("Bid amount too small");
      setLoading(null)
      return
    }
    try {
       // If the user is not connected, trigger the wallet connect modal
       if (!address && openConnectModal) {
        openConnectModal();
        return;
      }
      // If the user is connected, call the handlebid function and display a notification
      await toast.promise(handleBid(), {
        pending: "Placing bid...",
        success: "Placed bid successfully",
        error: "Failed to place bid",
      });
    } catch (e: any) {
      console.log({ e });
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
      // Once the purchase is complete, clear the loading state
    } finally {
      setLoading(null);
      setBidAmount(0)
    }
  }

  // If the product cannot be loaded, return null
  if (!product) return null;

  // Truncate the unnecessary part of address
 const truncateAddress = (address: string) => {
  const shortAddress = address.slice(0, 4) + "..." + address.slice(address.length - 4, address.length);
  if (!address) {
      return null;
  } else {
      return shortAddress;
  }
}

  // Return the JSX for the product component
  return (
    <div className={"shadow-lg relative rounded-b-lg"}>
      <p className="group">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-white xl:aspect-w-7 xl:aspect-h-8 ">
          {/* Show if a bid is open or not */}
          <span
            className={
              `absolute z-10 right-0 mt-4 ${product.stillOpen? 'bg-green-400': 'bg-red-500'} text-white p-1 rounded-l-lg px-4`
            }
          >
            {product.stillOpen ? "Open": "Closed"}
          </span>
          {/* Show the product image */}
          <img
            src={product.image}
            alt={"image"}
            className="w-full h-80 rounded-t-md  object-cover object-center group-hover:opacity-75"
          />
          {/* Show the address of the product creator as an identicon and link to the address on the Celo Explorer */}
          <Link
            href={`https://explorer.celo.org/alfajores/address/${product.creator}`}
            className={"absolute -mt-7 ml-6 h-16 w-16 rounded-full"}
          >
            {identiconTemplate(product.creator, 14)}
          </Link>
          {/* Show address of product owner */}
          <Link
            href={`https://explorer.celo.org/alfajores/address/${product.owner}`}
            className={"absolute -mt-16 ml-56 h-26 w-26 rounded-full"}
          >
            {identiconTemplate(product.owner, 30)}
          </Link>
        </div>

        <div className={"m-5"}>
          <div className={"pt-1"}>
            {/* Show the product name */}
            <p className="mt-4 text-2xl font-bold">{product.name}</p>
            <div className={"h-24 overflow-y-hidden scrollbar-hide"}>
              {/* Show the product description */}
              <h3 className="mt-4 text-sm text-gray-700">
                {product.description}
              </h3>
            </div>
          </div>
          
          <div className="mb-5">
            <div className="">
              {/* Address of the highest bidder */}
              <span className="italic">Highest Bidder: </span><span className="font-mono"><Link href={`https://explorer.celo.org/alfajores/address/${product.highestBidder}`}>{truncateAddress(product.highestBidder)}</Link></span>
            </div>
            <div>
              {/* Amount of the highest bidder */}
              <span className="italic ">Highest Bid: </span><span className="font-mono">{product.highestBid} CELO</span>
            </div>
          </div>

          <div>
            <div className={"flex flex-row mb-4"}>
              {/* Show the product location */}
              <img src={"/location.svg"} alt="Location" className={"w-6"} />
              <h3 className="pt-1 text-sm text-gray-700">{product.location}</h3>
            </div>

            {/* Display functionality buttons */}
            {
              product.stillOpen ? 
              <div>
                {product.creator == address ? 
                  <button
                    onClick={close}
                    className="mt-4 h-14 w-full border-[1px] border-gray-500 text-black p-2 rounded-lg hover:bg-black hover:text-white"
                    >
                    Close
                  </button>: 
                  <div className="flex justify-center items-center">
                    <button onClick={bid} className="w-48 h-14 bg-blue-500 rounded-lg ">
                      Bid ({ethers.utils.formatEther(bidAmount)} CELO)
                    </button>
                    <input min={Number(product.highestBid) + 1} onChange={e => setBidAmount(ethers.utils.parseEther(`${e.target.value || 0}`))} className="px-4 py-1 mx-3 w-28 rounded outline-gray-800" type="number" placeholder="Bid amount"/>
                  </div>
                }
              </div> : 
              <button disabled className="mt-4 h-14 w-[20rem] border-[1px] p-2 rounded-lg bg-black text-white">
                Closed
              </button>
            }
          </div>
        </div>
      </p>
    </div>
  );
};

export default Product;
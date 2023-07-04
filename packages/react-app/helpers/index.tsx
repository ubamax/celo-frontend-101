import Blockies from 'react-blockies';

// Returns an identicon for the given address
export const identiconTemplate = (address : string, size?: number | 14) => {
    return <Blockies size={size} 
    scale={4} 
    className="identicon border-2 border-white rounded-full" // optional className
    seed={address} // seed used to generate icon data, default: random
    />
}
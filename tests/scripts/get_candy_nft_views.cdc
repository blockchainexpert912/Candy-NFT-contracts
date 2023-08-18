/// This script checks all the supported views from
/// the CandyNFT contract. Used for testing only.

import CandyNFT from "CandyNFT"
import MetadataViews from "MetadataViews"

pub fun main(): Bool {
    let views = CandyNFT.getViews()

    let expected = [
        Type<MetadataViews.NFTCollectionData>(),
        Type<MetadataViews.NFTCollectionDisplay>()
    ]
    assert(expected == views)

    return true
}

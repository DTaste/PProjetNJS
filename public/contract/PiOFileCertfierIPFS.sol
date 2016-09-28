contract PiOClaimRegisterSigner {
	
	struct Claim {
		address publisher;
		uint timestamp;
                string projectName;
		uint claimType;	
                address[] partnersInvited;
                mapping(address => bool) partnersSignature;	
	}

            

        mapping(address => string) private validPartners;

	mapping(bytes32 => Claim) private hashClaim;
	event PublishEvent (address indexed _from, bytes32 hash);

		
	address pio_owner;
    
	function PiOClaimRegisterSigner(){
		pio_owner = msg.sender; 
	}

	function register(bytes32 hash, string projectName, uint claimType, address[] partners) returns (bool success) {
	
		if (claimExists(hash)) {
			return false;
	    }else{

        		
			hashClaim[hash].publisher = msg.sender;
                        hashClaim[hash].timestamp = now;
                        hashClaim[hash].projectName = projectName;
			hashClaim[hash].claimType = claimType;			
	        	for(uint i=0;i<partners.length;i++){
                            hashClaim[hash].partnersInvited.push(partners[i]);
                        }
			PublishEvent(msg.sender,hash);
	
			return true;
	        }
	        

    	}

        function signClaim (bytes32 hash) {
                if (claimExists(hash)) {
                    if (validPartners[msg.sender] != 0) {
                        hashClaim[hash].partnersSignature[msg.sender] = true;
                    }
                }
        }


        function addPartners (address partner, string partnerName) {
            if (msg.sender != pio_owner) return;
            partners[partner] = partnerName;
        }
		

	function getClaim(bytes32 hash) constant returns (address publisher, uint timestamp, string projectName, uint claimType) {
		Claim record = [hash];        
		publisher = record.publisher;
		timestamp = record.timestamp;
                projectName = record.projectName;		
		claimType = record.claimType;
	}

    

	function claimExists(bytes32 hash) constant returns (bool exists){
        	if (hashClaim[hash].timestamp != 0) {
        		return true;
        	}
		return false;
	}
	

	function kill() {
            if (msg.sender != pio_owner) return;
            selfdestruct(pio_owner);   
        }
}


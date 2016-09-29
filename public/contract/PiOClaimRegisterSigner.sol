pragma solidity ^0.4.2;

contract PiOClaimRegisterSigner {
	
	struct Claim {
		address publisher;
		uint timestamp;
        string projectName;
        string fileName;
		uint claimType;	
        address[] involvedPartners;
        mapping(address => bool) signed;	
	}
	
	struct Partner {
	       address partner;
	       string name;
	       string mail;
	       bool canSign;
	}

    mapping (address => uint) private partnersId;
    Partner[] private partners;        
    

	mapping(bytes32 => Claim) private hashClaim;
	
	event RegisterEvent (address indexed _partner, bytes32 indexed _hash);
	event SignEvent (address indexed _partner, bytes32 indexed _hash);
	event PartnershipChanged(address indexed _partner, bool _isSigner);

    address pio_owner;
    
	
	modifier onlyPartners {
        if (!partners[partnersId[msg.sender]].canSign) 
            throw;
        _;
    }
    
    modifier onlyOwner {
        if (msg.sender != pio_owner) 
            throw;
        _;
    }
    
	
    
	function PiOClaimRegisterSigner(){
		pio_owner = msg.sender; 
		partners.length++;
		partners[0].partner = pio_owner;
		partners[0].name = "PlayItOpen";
        partners[0].mail = "contact@playitopen.org";
        partners[0].canSign = true;
        partnersId[pio_owner] = 0;
	}

	function register(bytes32 hash, string projectName, string fileName, uint claimType, address[] involvedPartners) onlyPartners returns (bool success)  {
	
		if (claimExists(hash)) {
			return false;
	    }else{

        		
			hashClaim[hash].publisher = msg.sender;
            hashClaim[hash].timestamp = now;
            hashClaim[hash].projectName = projectName;
            hashClaim[hash].fileName = fileName;
			hashClaim[hash].claimType = claimType;			
	        for(uint i=0;i<involvedPartners.length;i++){
                    hashClaim[hash].involvedPartners.push(involvedPartners[i]);
            }
			
			RegisterEvent(msg.sender,hash);
	
			return true;
	        }
	        

    }

    function signClaim (bytes32 hash) onlyPartners {
            if (claimExists(hash)) {
                hashClaim[hash].signed[msg.sender] = true;
                SignEvent(msg.sender, hash);
            }
                
    }


   /*make partner*/
    function changePartnership(address targetMember, string partnerName, string partnerMail, bool canSign) onlyOwner {
        uint id;
        if (partnersId[targetMember] == 0) {
           partnersId[targetMember] = partners.length;
           id = partners.length++;
           partners[id] = Partner({partner: targetMember, name: partnerName, mail: partnerMail, canSign: canSign});
        } else {
            id = partnersId[targetMember];
            Partner p = partners[id];
            p.canSign = canSign;
        }

        PartnershipChanged(targetMember, canSign);

    }
    

    function getPartnersNumber () onlyPartners constant returns (uint) {
        return partners.length;
    }
    
    function getPartnerIndexData (uint index) onlyPartners constant returns (address partnerAddress, string name, string mail) {
        Partner _partner = partners[index];        
		partnerAddress = _partner.partner;
		name = _partner.name;
        mail = _partner.mail;		
		
    }
    
    function getPartnerAdressData (address partnerAddress) onlyPartners constant returns (string name, string mail) {
        Partner _partner = partners[partnersId[partnerAddress]];
		name = _partner.name;
        mail = _partner.mail;
    }
		

	function getClaim(bytes32 hash) constant returns (address publisher, uint timestamp, string projectName, string fileName, uint claimType, address[] involvedPartners) {
		if (claimExists(hash)) {
		    Claim _claim = hashClaim[hash];        
		    publisher = _claim.publisher;
		    timestamp = _claim.timestamp;
            projectName = _claim.projectName;		
            fileName = _claim.fileName;
		    claimType = _claim.claimType;
		    involvedPartners = _claim.involvedPartners;
		} 
	}
	
	function isClaimSigned (bytes32 hash, address partner) constant returns (bool isSigned){ 
	    if (claimExists(hash)) {
	        Claim _claim = hashClaim[hash];
	        return _claim.signed[partner];
	    }
	    return false;
	    
	}

    

	function claimExists(bytes32 hash) constant returns (bool exists){
        	if (hashClaim[hash].timestamp != 0) {
        		return true;
        	}
		return false;
	}
	

	function kill() onlyOwner {
            selfdestruct(pio_owner);   
    }
}


pragma solidity ^0.4.0;

contract CampaignFactory{

     address[] public deployedCampaigns;

     function createCampaign(uint minimum) public{
        address campaign = new Campaign(minimum,msg.sender);
        deployedCampaigns.push(campaign);
     }

     function deployedCampaigns() public view returns(address[]){
        return deployedCampaigns;
     }

}

contract Campaign{

    struct Request{
       string description;
       uint value;
       address receipient;
       bool completed;
       uint approvalCount;
       mapping(address=>bool) approvals;
    }
    address public manager;
    uint public minimumContribution;
    mapping(address=>bool) public  approvers;
    Request[] public requests;
    uint approversCount;

    modifier restricted(){
     require(msg.sender == manager);
     _;
    }

    function Campaign(uint minimum,address creator) public{
     manager = creator;
     minimumContribution = minimum;
    }

    function contribute() public payable{
     require(msg.value > minimumContribution);
     approvers[msg.sender] = true;
     approversCount++;
    }

    function createRequest(string description, uint value, address receipient) public restricted{
     Request memory newRequest = Request({
      description:description,
      value:value,
      receipient:receipient,
      completed:false,
      approvalCount:0
     });

     requests.push(newRequest);
    }

    function approveRequest(uint index) public {
      Request storage request = requests[index];
      require(approvers[msg.sender]);
      require(!request.approvals[msg.sender]);
      request.approvals[msg.sender] = true;
      request.approvalCount++;
    }

    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];
        require(!request.completed);
        require(request.approvalCount > (approversCount/2) );
        request.receipient.transfer(request.value);
        request.completed = true;
    }

}

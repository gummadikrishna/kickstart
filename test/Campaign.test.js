const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const web3 = new Web3(ganache.provider());
const compiledCampaignFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let campaignFactory;
let campaign;
let campaignAddress;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  campaignFactory = await new web3.eth.Contract(
      JSON.parse(compiledCampaignFactory.interface)
    )
    .deploy({
      data: compiledCampaignFactory.bytecode
    })
    .send({
      from: accounts[0],
      gas: "1000000"
    });

  await campaignFactory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "1000000"
  });

  [campaignAddress] = await campaignFactory.methods.deployedCampaigns().call();
  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe("Campaigns", () => {

  it("Check Campaign and Factory deployed ", () => {
    assert.ok(campaignFactory.options.address);
    assert.ok(campaign.options.address);
  });

  it("Mark creator of Campaign as Manager", async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });

  it("Accept Minimum contribution and mark them as approver", async () => {
    await campaign.methods.contribute().send({
      value: "300",
      from: accounts[1]
    });

    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  it("Check Minimum Contribution", async () => {
    try {
      await campaign.methods.contribute().send({
        value: "5",
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Allow manager to create a payment request", async () => {
    await campaign.methods
      .createRequest("Buy Batteries", 300, accounts[1])
      .send({
        from: accounts[0],
        gas: "1000000"
      });
    const request = await campaign.methods.requests(0);
    assert.ok("Buy Batteries", request.description);
  });

  it("End to End Request Processing", async () => {

    let currentBalance = await web3.eth.getBalance(accounts[1]);
    currentBalance = web3.utils.fromWei(currentBalance, 'ether');
    currentBalance = parseFloat(currentBalance);

    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether')
    });

    await campaign.methods.createRequest('Buy Batteries', web3.utils.toWei('5', 'ether'), accounts[1])
      .send({
        from: accounts[0],
        gas: "1000000"
      });

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "1000000"
    });

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "1000000"
    });
    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);

    assert(balance > currentBalance);
  });
});

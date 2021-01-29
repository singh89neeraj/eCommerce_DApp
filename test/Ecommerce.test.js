const Ecommerce = artifacts.require('./Ecommerce.sol');

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Ecommerce', ([deployer, seller, buyer]) => {

    let ecommerce

    before(async() => {
      ecommerce = await Ecommerce.deployed()
    })

    describe('deployment', async () => {
      it('deploys successfully', async () =>{
          const address = await ecommerce.address
          assert.notEqual(address, 0x0)
          assert.notEqual(address, '')
          assert.notEqual(address, null)
          assert.notEqual(address, undefined)
      })

      it('has a name', async () =>{
        const name = await ecommerce.name()
        assert.equal(name, 'My Ecommerce')
      })
    })

    describe('products', async () => {
      let result, productCount
      before(async() => {
        result = await ecommerce.createProduct('macbook pro', web3.utils.toWei('1', 'Ether'), {from:seller})
        productCount = await ecommerce.productCount()
      })

      it('Product Created', async () =>{
        // Success
        assert.equal(productCount, 1)
        //console.log(result.logs)
        const event = result.logs[0].args
        assert.equal(event.id.toNumber(), productCount.toNumber(), 'ID Matches Product Count')
        assert.equal(event.name,'macbook pro','name verified')
        assert.equal(event.price,web3.utils.toWei('1', 'Ether'),'price verified')
        assert.equal(event.owner,seller,'owner verified')
        assert.equal(event.purchased,false,'purchase verified')


        //Name failure
        await await ecommerce.createProduct('', web3.utils.toWei('1', 'Ether'), {from:seller}).should.be.rejected;
        //Price failure
        await await ecommerce.createProduct('macbook pro', 0, {from:seller}).should.be.rejected;
      })

      it('Product listed', async () =>{
        const product = await ecommerce.products(productCount)
        assert.equal(product.id.toNumber(), productCount.toNumber(), 'ID Matches Product Count')
        assert.equal(product.name,'macbook pro','name verified')
        assert.equal(product.price,web3.utils.toWei('1', 'Ether'),'price verified')
        assert.equal(product.owner,seller,'owner verified')
        assert.equal(product.purchased,false,'purchase verified')

      })

      it('Product sold', async () =>{
        // get old balance of seller
        let oldSellerBalance
        oldSellerBalance = await web3.eth.getBalance(seller)
        oldSellerBalance = new web3.utils.BN(oldSellerBalance)
        // purchased successfully
        result = await ecommerce.purchaseProduct(productCount, {from:buyer, value:web3.utils.toWei('1', 'Ether')})

        // check logs
        //console.log(result.logs)
        const event = result.logs[0].args
        assert.equal(event.id.toNumber(), productCount.toNumber(), 'ID Matches Product Count')
        assert.equal(event.name,'macbook pro','name verified')
        assert.equal(event.price,web3.utils.toWei('1', 'Ether'),'price verified')
        assert.equal(event.owner,buyer,'owner verified')
        assert.equal(event.purchased,true,'purchase verified')

        // validate seller recieved the funds
        let newSellerBalance
        newSellerBalance = await web3.eth.getBalance(seller)
        newSellerBalance = new web3.utils.BN(newSellerBalance)

        let price
        price = web3.utils.toWei('1', 'Ether')
        price = new web3.utils.BN(price)

        //console.log(oldSellerBalance, newSellerBalance, price)

        const expectedBalance = oldSellerBalance.add(price)
        assert.equal(newSellerBalance.toString(), expectedBalance.toString())


        // purchase failure
        // invalid product code
        await ecommerce.purchaseProduct(productCount, {from:buyer, value:web3.utils.toWei('1', 'Ether')}).should.be.rejected;
        // insufficient balance
        await ecommerce.purchaseProduct(99, {from:buyer, value:web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
        // duplicate balance
        await ecommerce.purchaseProduct(productCount, {from:deployer, value:web3.utils.toWei('1', 'Ether')}).should.be.rejected;
        // seller cant be buyer
        await ecommerce.purchaseProduct(productCount, {from:seller, value:web3.utils.toWei('1', 'Ether')}).should.be.rejected;
      })


    })






})

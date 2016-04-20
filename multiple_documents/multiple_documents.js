// Request Signature on multiple Documents (Node.js)
// 
// To run this sample
//  1. Copy the file to your local machine and give .js extension (i.e. example.js)
//  2. Change "***" to appropriate values
//  3. Install docusign-esign, async, and fs packages
//     npm install docusign-esign
//     npm install async
//     npm install fs
//  4. Ensure sure 'NDA.pdf' and 'House.pdf' and 'contractor_agreement.docx' (copy from '_sample_documents') exist in the same directory
//  5. Execute
//     node example.js 


var docusign = require('docusign-esign'),
	async = require('async'),
	fs = require('fs'),
	path = require('path');

var integratorKey = '***',	// Integrator Key associated with your DocuSign Integration
	email = '***',			// Email for your DocuSign Account
	password = '***',		// Password for your DocuSign Account
	signerName = '***',	// Recipient's Full Name
	signerEmail = '***', // Recipient's Email
	ccName = '***',	// Recipient's Full Name
	ccEmail = '***', // Recipient's Email
	docusignEnv = 'demo',	// DocuSign Environment generally demo for testing purposes ('www' == production)
	fileToSign1 = 'NDA.pdf',
	fileToSign2 = 'House.pdf',
	fileToSign3 = 'contractor_agreement.docx',
	baseUrl = 'https://' + docusignEnv + '.docusign.net/restapi';

async.waterfall(
  [
	/////////////////////////////////////////////////////////////////////////////////////
	// Step 1: Login (used to retrieve your accountId and account baseUrl)
	/////////////////////////////////////////////////////////////////////////////////////

	function login(next) {

		// initialize the api client
		var apiClient = new docusign.ApiClient();
		apiClient.setBasePath(baseUrl);

		// create JSON formatted auth header
		var creds = JSON.stringify({
		  Username: email,
		  Password: password,
		  IntegratorKey: integratorKey
		});
		apiClient.addDefaultHeader('X-DocuSign-Authentication', creds);

		// assign api client to the Configuration object
		docusign.Configuration.default.setDefaultApiClient(apiClient);

		// login call available off the AuthenticationApi
		var authApi = new docusign.AuthenticationApi();

		// login has some optional parameters we can set
		var loginOps = new authApi.LoginOptions();
		loginOps.setApiPassword('true');
		loginOps.setIncludeAccountIdGuid('true');
		authApi.login(loginOps, function (err, loginInfo, response) {
			if (err) {
				console.error(err.response ? err.response.error : err);
				return;
			}
			if (loginInfo) {
				// list of user account(s)
				// note that a given user may be a member of multiple accounts
				var loginAccounts = loginInfo.getLoginAccounts();
				console.log('LoginInformation: ' + JSON.stringify(loginAccounts));
				next(null, loginAccounts);
			}
		});
	},
	
	/////////////////////////////////////////////////////////////////////////////////////
	// Step 2: Request Signature on multiple Documents (mixed types: PDF and DOCX)
	/////////////////////////////////////////////////////////////////////////////////////

	function requestSignature(loginAccounts, next){
		console.log('requestSignature');

		// create an envelope that will store the document(s), field(s), and recipient(s)
		var envDef = new docusign.EnvelopeDefinition();
		envDef.setEmailSubject('Please sign your place on these documents sent from the DocuSign Node SDK)');

		// Create Documents

		// NDA (Document 1)
		var doc1 = new docusign.Document();
		var base64Doc = new Buffer(getFileBytes(fileToSign1)).toString('base64');
		doc1.setDocumentBase64(base64Doc);
		doc1.setName('NDA-Request.pdf'); // can be different from actual file name
		doc1.setDocumentId('1'); // hardcode so we can easily refer to this document later

		// House (Document 2)
		var doc2 = new docusign.Document();
		var base64Doc = new Buffer(getFileBytes(fileToSign2)).toString('base64');
		doc2.setDocumentBase64(base64Doc);
		doc2.setName('House-Doc.pdf'); // can be different from actual file name
		doc2.setDocumentId('2'); // hardcode so we can easily refer to this document later

		// Contractor Agreement (Document 3)
		var doc3 = new docusign.Document();
		var base64Doc = new Buffer(getFileBytes(fileToSign3)).toString('base64');
		doc3.setDocumentBase64(base64Doc);
		doc3.setName('Contractor-Agreement.docx'); // can be different from actual file name
		doc3.setFileExtension('docx');
		doc3.setDocumentId('3'); // hardcode so we can easily refer to this document later

		// Add Documents to Envelope
		var docs = [];
		docs.push(doc1);
		docs.push(doc2);
		docs.push(doc3);
		envDef.setDocuments(docs);

		// Add Signers and CC Recipients

		// add a recipient to sign the document, identified by name and email we used above
		var signer = new docusign.Signer();
		signer.setEmail(signerEmail);
		signer.setName(signerName);
		signer.setRecipientId('1');

		// add a CC recipient
		var cc = new docusign.CarbonCopy();
		cc.setEmail(ccEmail);
		cc.setName(ccName);
		cc.setRecipientId('2');
 	
 		// Add signing tags and additional (comany name, etc.) tags
		// - using "anchor" (soon to be called AutoPlace) tags 

		var signHere1 = new docusign.SignHere();
		signHere1.setName('Please Sign Here');
		signHere1.setDocumentId('1');
		signHere1.setAnchorString('signer1sig');
		// signHere1.setPageNumber('1'); // PageNumber not necessary for Anchor Text!
		signHere1.setRecipientId('1');
		signHere1.setAnchorXOffset('0');
		signHere1.setAnchorYOffset('0');
		signHere1.setAnchorUnits('mms');
		signHere1.setOptional('false');
		signHere1.setTabLabel('signer1sig');

		var signHere2 = new docusign.SignHere();
		signHere2.setName('Please Sign Here');
		signHere2.setDocumentId('2');
		signHere2.setPageNumber('1');
		signHere2.setRecipientId('1');
		signHere2.setXPosition('89');
		signHere2.setYPosition('40');
		signHere2.setAnchorUnits('mms');
		signHere2.setOptional('false');
		signHere2.setTabLabel('signer1_doc2');

		var signHere3 = new docusign.SignHere();
		signHere3.setName('Please Sign Here');
		signHere3.setAnchorString('Client Signature');
		signHere3.setDocumentId('3');
		signHere3.setRecipientId('1');
		signHere3.setAnchorXOffset('0');
		signHere3.setAnchorYOffset('-4');
		signHere3.setAnchorUnits('mms');
		signHere3.setOptional('false');
		signHere3.setTabLabel('doc3_client_sig');


		var fullName1 = new docusign.FullName();
		fullName1.setName('Full Name');
		fullName1.setAnchorString('signer1name');
		fullName1.setDocumentId('3');
		fullName1.setRecipientId('1');
		fullName1.setAnchorXOffset('0');
		fullName1.setAnchorYOffset('-6');
		fullName1.setAnchorUnits('mms');
		fullName1.setFontSize('Size12');
		fullName1.setTabLabel('Full Name');


		var textTab1 = new docusign.Text();
		textTab1.setName('Company');
		textTab1.setDocumentId('1');
		textTab1.setAnchorString('signer1company');
		textTab1.setRecipientId('1');
		textTab1.setAnchorXOffset('0');
		textTab1.setAnchorYOffset('-8');
		textTab1.setAnchorUnits('mms');
		textTab1.setRequired('true');
		textTab1.setTabLabel('Company');

		var textTab2 = new docusign.Text();
		textTab2.setName('Company');
		textTab2.setAnchorString('Client Name');
		textTab2.setDocumentId('3');
		textTab2.setRecipientId('1');
		textTab2.setAnchorXOffset('0');
		textTab2.setAnchorYOffset('-10');
		textTab2.setAnchorUnits('mms');
		textTab2.setFontSize('Size12');
		textTab2.setRequired('true');
		textTab2.setTabLabel('Company');

		var textTab3 = new docusign.Text();
		textTab3.setDocumentId('3');
		textTab3.setPageNumber('1');
		textTab3.setRecipientId('1');
		textTab3.setXPosition('145');
		textTab3.setYPosition('193');
		textTab3.setFontSize('Size12');
		textTab3.setRequired('true');
		textTab3.setTabLabel('Company');


		var dateSigned1 = new docusign.DateSigned();
		dateSigned1.setName('Date Signed');
		dateSigned1.setAnchorString('signer1date');
		dateSigned1.setDocumentId('1');
		dateSigned1.setRecipientId('1');
		dateSigned1.setAnchorXOffset('0');
		dateSigned1.setAnchorYOffset('-6');
		dateSigned1.setFontSize('Size12');
		dateSigned1.setTabLabel('date_signed');

		var dateSigned2 = new docusign.DateSigned();
		dateSigned2.setName('Date Signed');
		dateSigned2.setDocumentId('2');
		dateSigned2.setPageNumber('1');
		dateSigned2.setRecipientId('1');
		dateSigned2.setXPosition('89');
		dateSigned2.setYPosition('100');
		dateSigned2.setFontSize('Size12');
		dateSigned2.setTabLabel('doc2_date_signed');


		// can have multiple tabs, so need to add to envelope as a single element list
		var signHereTabs = [];
		signHereTabs.push(signHere1);
		signHereTabs.push(signHere2);
		signHereTabs.push(signHere3);

		var fullNameTabs = [];
		fullNameTabs.push(fullName1);

		var textTabs = [];
		textTabs.push(textTab1);
		textTabs.push(textTab2);
		textTabs.push(textTab3);

		var dateSignedTabs = [];
		dateSignedTabs.push(dateSigned1);
		dateSignedTabs.push(dateSigned2);

		var tabs = new docusign.Tabs();
		tabs.setSignHereTabs(signHereTabs);
		tabs.setFullNameTabs(fullNameTabs);
		tabs.setTextTabs(textTabs);
		tabs.setDateSignedTabs(dateSignedTabs);
		signer.setTabs(tabs);

		// add recipients to the envelope (signer and carbon copy)
		envDef.setRecipients(new docusign.Recipients());
		envDef.getRecipients().setSigners([]);
		envDef.getRecipients().setCarbonCopies([]);
		envDef.getRecipients().getSigners().push(signer);
		envDef.getRecipients().getCarbonCopies().push(cc);

		// send the envelope by setting |status| to "sent". To save as a draft set to "created"
		// - note that the envelope will only be 'sent' when it reaches the DocuSign server with the 'sent' status (not in the following call)
		envDef.setStatus('sent');

		// use the |accountId| we retrieved through the Login API to create the Envelope
		var loginAccount = new docusign.LoginAccount();
		loginAccount = loginAccounts[0];
		var accountId = loginAccount.accountId;

		// instantiate a new EnvelopesApi object
		var envelopesApi = new docusign.EnvelopesApi();

		envDef = removeNulls(envDef); // fixes API Error: 'The request body is missing or improperly formatted. Null object cannot be converted to a value type.' by removing all `null` values

		// call the createEnvelope() API
		envelopesApi.createEnvelope(accountId, envDef, null, function (error, envelopeSummary, response) {
			if (error) {
				console.error(error);
				// console.error(response);
				return;
			}

			if (envelopeSummary) {
				console.log('EnvelopeSummary: ' + JSON.stringify(envelopeSummary,null,2));
			}
		});
	}

]);


/////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
/////////////////////////////////////////////////////////////////////////////////////
function getFileBytes(filename){
	// create a byte array that will hold our document bytes
	var fileBytes = null;
	try {
		// read file from a local directory
		fileBytes = fs.readFileSync(path.resolve([__filename, '..', filename].join('/')));
	} catch (ex) {
		// handle error
		console.log('Exception: ' + ex);
		return;
	}
	return fileBytes;
}

function removeNulls(obj) {
	// This function is necessary for docusign.Text() fields (otherwise an unhelpful error from the API is returned for `null` fields) 
	var isArray = obj instanceof Array;
	for (var k in obj) {
		if (obj[k] === null) isArray ? obj.splice(k, 1) : delete obj[k];
		else if (typeof obj[k] == "object") removeNulls(obj[k]);
		if (isArray && obj.length == k) removeNulls(obj);
	}
	return obj;
}
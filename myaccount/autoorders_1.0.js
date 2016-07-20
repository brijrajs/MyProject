var myAccount = new ultracart.MyAccount(merchantId);

// ---------------------------------------------------------
// Security (well, not really security, but a helper to
// redirect the user if they're not logged in.  Security
// is handled by the REST API.
// ---------------------------------------------------------
var redirectToLogin = function () {
  var location_href = "/cgi-bin/UCMyAccount?merchantId=" + window.merchantId;
  if (location.hash && location.hash.length > 0) {
    location_href += "&hash=" + location.hash.substring(1);
  }
  location.href = location_href;
};

var theDocument = jQuery(document);
// ajaxSend isn't need.  authentication is done via cookies that should already be present with every request.
//theDocument.ajaxSend(function (event, xhr) {
//    var authToken = $.cookie('access_token');
//    if (authToken) {
//        xhr.setRequestHeader("Authorization", "Bearer " + authToken);
//    }
//});

theDocument.ajaxError(function (event, xhr) {
  if (xhr.status == 401)
    redirectToLogin();
});

jQuery.ajaxSetup({cache: false});


// ===============================================================================
//  BEGIN PCI 3.0 compliance code
//  What you might need to change:
//     the selector properties point to the two credit card fields.  If you change the
//     ids of the fields, you need to re-point those selectors at the fields properly.
//  See also:
//  http://docs.ultracart.com/display/ucdoc/UltraCart+Hosted+Credit+Card+Fields
// ===============================================================================
var hostedFields = null;

// setup should be called each time the UI updates.
function setupSecureCreditCardFields(jQueryContext) {
  // set this to true to see verbose debugging.  usually only UltraCart support will use this.
  window.ultraCartHostedFieldsDebugMode = true;
  hostedFields = UltraCartHostedFields.setup(jQuery, JSON3, {
    'sessionCredentials': {
      'merchantId': merchantId
    },
    'hostedFields': {
      'creditCardNumber': {
        'selector': '.credit-card-number-field'
        , 'selectorContext': jQueryContext
        , 'callback': function (card) {
          if (card && card.token) {
            var tokenField = jQuery('.credit-card-token-field', jQueryContext);
            if (tokenField && tokenField.length) {
              tokenField.val(card.token);
            }
          }
        }
      }
    }
  });
}


// teardown should be called each time a UI needs destroying.
function teardownSecureCreditCardFields() {
  if (hostedFields != null) {
    hostedFields.destroy();
    hostedFields = null;
  }
}

// ==========================================================================
// END PCI 3.0 compliance code
// ==========================================================================


// ---------------------------------------------------------
// app skeleton
// ---------------------------------------------------------

var app = {
  models: {},  // The M in MVC
  collections: {},  // Also the M in MVC, just collections of them.
  views: {},  // The V in MVC
  templates: [],
  zombieHunters: {}, // extensions that clean up event binding to avoid zombie event handlers
  commonFunctions: {}, // functions that are used in numerous places
  // the router is kind-of the C in MVC, but not in the traditional sense.  It's more of a helper controller,
  // which takes a look at the url (and fragments), and does additional things based on what it is.
  // the router is created during document.ready
  router: null,
  data: {} // this will hold *instances* of collections and models.  This is actual data, not definitions
};

// ---------------------------------------------------------------------
// --- zombie hunters  (prevent orphaned event handlers)
// ---------------------------------------------------------------------
app.zombieHunters.appView = uc.commonFunctions.createAppView('autoOrders');


// ---------------------------------------------------------
// common functions
// ---------------------------------------------------------


// ---------------------------------------------------------
// data models
// ---------------------------------------------------------

app.models.AutoOrder = Backbone.Model.extend({
  'idAttribute': 'autoOrderOid',
  url: function () {
    return '/rest/myaccount/autoOrders/' + this.get('autoOrderOid')
  }
});

app.collections.AutoOrders = Backbone.Collection.extend({
  model: app.models.AutoOrder,
  url: '/rest/myaccount/autoOrders',
  everBeenFetched: false
});


// an empty disconnected model used to prevent the same query from running multiple times simultaneously. (i.e. user clicks button numerous times)
app.models.StateManager = Backbone.Model.extend();


// ---------------------------------------------------------
// views
// ---------------------------------------------------------

// ---------------------------------------------------------------------
// --- AutoOrder ---
// ---------------------------------------------------------------------
app.views.AutoOrder = Backbone.View.extend({
  tagName: 'article',
  events: {
    'click .updateShipDateButton': 'updateShipDateLoad',
    'click .updatePaymentButton': 'updatePaymentLoad',
    'click .updateShippingButton': 'updateShippingLoad',
    'click .updateBillingButton': 'updateBillingLoad',
    'click .cancelButton': 'cancelOrder',
    'click .subscription-address-save-button': 'saveAddress',
    'click .subscription-address-cancel-button': 'cancelAddress',
    'click .subscription-payment-save-button': 'savePayment',
    'click .subscription-payment-cancel-button': 'cancelPayment',
    'click .subscription-shipdate-save-button': 'saveShipDate',
    'click .subscription-shipdate-cancel-button': 'cancelShipDate'

  },
  single: false, // if true, this model should listen to its own model event triggers

  'onClose': function () {
    if (this.single) {
      this.model.on('sync', this.render, this);
    }
  },

  initialize: function (attributes, options) {
    if (options && options.single) {
      this.model.on('sync', this.render, this);
      this.single = true;
    }
    _.bindAll(this);
  },

  render: function () {
    console.log('autoOrder ' + this.model.get('autoOrderOid') + ' render');
    var context = this.model.attributes;

    context['enableCancel'] = (app.data.permissions && app.data.permissions.AutoOrderCancel);
    context['enableUpdateShipDate'] = (app.data.permissions && app.data.permissions.AutoOrderUpdateShipDate);
    context['enableUpdateBilling'] = (app.data.permissions && app.data.permissions.AutoOrderUpdateBilling);
    context['enableUpdateShipping'] = (app.data.permissions && app.data.permissions.AutoOrderUpdateShipping);
    context['enableUpdatePayment'] = (app.data.permissions && app.data.permissions.AutoOrderUpdatePayment);

    console.log(context);

    this.$el.html(app.templates.autoOrder(context));
    this.$el.addClass('subscription');
    return this;
  },

  'updateShipDateLoad': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('updateShipDateLoad');
    jQuery('.subscription-details', this.$el).hide();

    var context = {};

    this.currentShipDateId = 'sd' + Math.floor((Math.random() * 1000) + 1);
    context.shipDateId = this.currentShipDateId;

    var html = app.templates.shipDateEdit(context);
    jQuery('.subscription-edit-panel', this.$el).html(html).show();

    var formElements = {};
    formElements[this.currentShipDateId] = "Y-ds-m-ds-d";  // m-sl-d-sl-Y

    var opts = {
      formElements: formElements,
      statusFormat: "l-cc-sp-d-sp-F-sp-Y"
    };

    datePickerController.createDatePicker(opts);
    var today = new Date();
    datePickerController.setRangeLow(this.currentShipDateId, today.getFullYear() + today.getMonth() + today.getDay());

  },

  'updatePaymentLoad': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('updatePaymentLoad');
    jQuery('.subscription-details', this.$el).hide();

    var context = {};

    var years = [];
    var dt = new Date();
    var year = dt.getFullYear();
    for (var i = 0; i < 20; i++) {
      years.push(year + i);
    }
    context['years'] = years; // credit card expiration years

    context.creditCardType = this.model.get('creditCardType');
    context.cardNumber = this.model.get('creditCardNumber');
    context.creditCardExpirationMonth = this.model.get('creditCardExpirationMonth');
    context.creditCardExpirationYear = this.model.get('creditCardExpirationYear');

    var html = app.templates.paymentEdit(context);
    jQuery('.subscription-edit-panel', this.$el).html(html).show();
    setupSecureCreditCardFields(this.$el);

  },

  'updateShippingLoad': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('updateShippingLoad');
    jQuery('.subscription-details', this.$el).hide();

    var context = {};

    context.addressType = 'shipping';
    context.firstName = this.model.get('shipToFirstName');
    context.lastName = this.model.get('shipToLastName');
    context.title = this.model.get('shipToTitle');
    context.company = this.model.get('shipToCompany');
    context.address1 = this.model.get('shipToAddress1');
    context.address2 = this.model.get('shipToAddress2');
    context.city = this.model.get('shipToCity');
    context.state = this.model.get('shipToState');
    context.postalCode = this.model.get('shipToPostalCode');
    context.country = this.model.get('shipToCountry');
    context.dayPhone = this.model.get('shipToPhone');
    context.eveningPhone = this.model.get('shipToEveningPhone');

    var html = app.templates.addressEdit(context);
    jQuery('.subscription-edit-panel', this.$el).html(html).show();

  },

  'updateBillingLoad': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('updateBillingLoad');
    jQuery('.subscription-details', this.$el).hide();

    var context = {};

    context.addressType = 'billing';
    context.firstName = this.model.get('billToFirstName');
    context.lastName = this.model.get('billToLastName');
    context.title = this.model.get('billToTitle');
    context.company = this.model.get('billToCompany');
    context.address1 = this.model.get('billToAddress1');
    context.address2 = this.model.get('billToAddress2');
    context.city = this.model.get('billToCity');
    context.state = this.model.get('billToState');
    context.postalCode = this.model.get('billToPostalCode');
    context.country = this.model.get('billToCountry');
    context.dayPhone = this.model.get('billToDayPhone');
    context.eveningPhone = this.model.get('billToEveningPhone');

    var html = app.templates.addressEdit(context);
    jQuery('.subscription-edit-panel', this.$el).html(html).show();


  },

  'saveAddress': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('save address');

    var addressType = jQuery('[name=addressType]', this.$el).val();
    var changes = {};

    if (addressType == 'billing') {
      changes.billToFirstName = jQuery.trim(jQuery('[name=firstName]', this.$el).val());
      changes.billToLastName = jQuery.trim(jQuery('[name=lastName]', this.$el).val());
      changes.billToTitle = jQuery.trim(jQuery('[name=title]', this.$el).val());
      changes.billToCompany = jQuery.trim(jQuery('[name=company]', this.$el).val());
      changes.billToAddress1 = jQuery.trim(jQuery('[name=address1]', this.$el).val());
      changes.billToAddress2 = jQuery.trim(jQuery('[name=address2]', this.$el).val());
      changes.billToCity = jQuery.trim(jQuery('[name=city]', this.$el).val());
      changes.billToState = jQuery.trim(jQuery('[name=state]', this.$el).val());
      changes.billToPostalCode = jQuery.trim(jQuery('[name=postalCode]', this.$el).val());
      changes.billToCountry = jQuery.trim(jQuery('[name=country]', this.$el).val());
      changes.billToDayPhone = jQuery.trim(jQuery('[name=dayPhone]', this.$el).val());
      changes.billToEveningPhone = jQuery.trim(jQuery('[name=eveningPhone]', this.$el).val());
      this.model.save(changes);
      jQuery('.subscription-details', this.$el).show();
      jQuery('.subscription-edit-panel', this.$el).hide().html('');

    } else if (addressType == 'shipping') {

      changes.shipToFirstName = jQuery.trim(jQuery('[name=firstName]', this.$el).val());
      changes.shipToLastName = jQuery.trim(jQuery('[name=lastName]', this.$el).val());
      changes.shipToTitle = jQuery.trim(jQuery('[name=title]', this.$el).val());
      changes.shipToCompany = jQuery.trim(jQuery('[name=company]', this.$el).val());
      changes.shipToAddress1 = jQuery.trim(jQuery('[name=address1]', this.$el).val());
      changes.shipToAddress2 = jQuery.trim(jQuery('[name=address2]', this.$el).val());
      changes.shipToCity = jQuery.trim(jQuery('[name=city]', this.$el).val());
      changes.shipToState = jQuery.trim(jQuery('[name=state]', this.$el).val());
      changes.shipToPostalCode = jQuery.trim(jQuery('[name=postalCode]', this.$el).val());
      changes.shipToCountry = jQuery.trim(jQuery('[name=country]', this.$el).val());
      changes.shipToPhone = jQuery.trim(jQuery('[name=dayPhone]', this.$el).val());
      changes.shipToEveningPhone = jQuery.trim(jQuery('[name=eveningPhone]', this.$el).val());
      this.model.save(changes);
      jQuery('.subscription-details', this.$el).show();
      jQuery('.subscription-edit-panel', this.$el).hide().html('');


    } else {
      console.log('unknown address type in address edit');
    }

  },


  'savePayment': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('save payment');

    var changes = {};

    changes.creditCardType = jQuery.trim(jQuery('[name=cardType]', this.$el).val());
    changes.creditCardExpirationMonth = jQuery.trim(jQuery('[name=cardExpMonth]', this.$el).val());
    changes.creditCardExpirationYear = jQuery.trim(jQuery('[name=cardExpYear]', this.$el).val());
    changes.creditCardToken = jQuery.trim(jQuery('[name=creditCardNumberToken]', this.$el).val());
    this.model.save(changes);
    teardownSecureCreditCardFields();
    jQuery('.subscription-details', this.$el).show();
    jQuery('.subscription-edit-panel', this.$el).hide().html('');

  },

  'cancelAddress': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('cancel address');
    jQuery('.subscription-details', this.$el).show();
    jQuery('.subscription-edit-panel', this.$el).hide().html('');
  },

  'cancelPayment': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('cancel payment');
    teardownSecureCreditCardFields();
    jQuery('.subscription-details', this.$el).show();
    jQuery('.subscription-edit-panel', this.$el).hide().html('');
  },


  'cancelOrder': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('cancelOrder');

    if (confirm('Are you sure you wish to cancel this subscription?')) {
      myAccount.cancelAutoOrder(this.model.get('autoOrderOid'), {
        success: function () {
          app.data.autoOrders.fetch();
        }
      });
    }
  },


  'saveShipDate': function (event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('saveShipDate');

    var dtStr = jQuery.trim(jQuery('#' + this.currentShipDateId).val());
    if (dtStr) {
      var m = moment(dtStr, "YYYY-MM-DD");
      if (m.isValid() && m.isAfter(new Date(), 'day')) {
        myAccount.updateAutoOrderShipmentDate(this.model.get('autoOrderOid'), dtStr, {
          success: function () {
            app.data.autoOrders.fetch();
          }
        });
        this.currentShipDateId = null;

      } else {
        alert("Please enter a valid date in the future.");
      }
    }

  },


  'cancelShipDate': function (event) {
    event.preventDefault();
    event.stopPropagation();

    this.currentShipDateId = null;

    console.log('cancel ship date');
    jQuery('.subscription-details', this.$el).show();
    jQuery('.subscription-edit-panel', this.$el).hide().html('');
  }

});


// ---------------------------------------------------------------------
// --- AutoOrders ---
// ---------------------------------------------------------------------
app.views.AutoOrders = Backbone.View.extend({
  tagName: 'div',
  childViews: [],
  events: {},

  'onClose': function () {
    this.collection.off('sync reset change', this.render, this);
    this.closeChildren();
    // dispose of the children
    _.each(this.childViews, function (view) {
      view.close();
    });
  },

  initialize: function () {
    this.collection.on('sync reset change', this.render, this);
    _.bindAll(this);
  },

  render: function () {

    console.log('autoOrders.render');

    var context = null;

    if (this.collection.everBeenFetched) {
      console.log('collection has been fetched. setting loading to false');
      context = {'loading': false};
    } else {
      console.log('collection has been fetched. setting loading to true');
      context = {'loading': true};
    }

    this.$el.html(app.templates.autoOrders(context));

    var that = this;

    // the first time, we don't need to do any clean up.  but subsequent render() calls need to close down any
    // existing views to avoid zombie event handlers.
    this.closeChildren();
    this.childViews = []; // re-init on each render so we capture any and all changed.

    this.collection.each(function (model) {
      console.log("creating view for auto order", model.attributes);
      that.childViews.push(new app.views.AutoOrder({model: model}));
    });

    var autoOrdersDiv = jQuery('#subscriptions');
    autoOrdersDiv.html('');
    _.each(this.childViews, function (view) {
      view.render();
      autoOrdersDiv.append(view.el);
    });

    if (this.childViews.length == 0 && !context.loading) {
      autoOrdersDiv.append("No subscriptions found.");
    }

    return this;
  },


  'closeChildren': function () {
    _.each(this.childViews, function (view) {
      view.close();
    });
  }


});


// ---------------------------------------------------------------------
// --- router (a kind of controller) ---
// ---------------------------------------------------------------------
app.Router = Backbone.Router.extend({
  routes: {
    "": "defaultRoute"
  },

  'defaultRoute': function () {

    var autoOrdersView = new app.views.AutoOrders({'collection': app.data.autoOrders});
    app.data.autoOrders.everBeenFetched = false; // reset the fetch so the 'please wait' shows again.
    app.zombieHunters.appView.showView(autoOrdersView);
    // everBeenFetched is a collection property used to distinguish between an initial page load and when there are no records
    // returned from the server.  The former should show 'please wait, loading records', the latter should show 'no records found'
    app.data.autoOrders.fetch({
      success: function (collection) {
        collection.everBeenFetched = true;
      }
    });
  }

});


jQuery(document).ready(function () {
  enablePleaseWaitMessage();

  app.data.stateManager = new app.models.StateManager();
  app.data.autoOrders = new app.collections.AutoOrders();
  app.data.permissions = null;

  app.templates.autoOrder = Handlebars.compile(jQuery('#subscription-template').html());
  app.templates.autoOrders = Handlebars.compile(jQuery('#subscriptions-template').html());
  app.templates.addressEdit = Handlebars.compile(jQuery('#address-edit-template').html());
  app.templates.paymentEdit = Handlebars.compile(jQuery('#payment-edit-template').html());
  app.templates.shipDateEdit = Handlebars.compile(jQuery('#shipdate-edit-template').html());

  app.router = new app.Router();

  // should never see a false here.  The handler at the top of the page will redirect if a 403 is given.
  myAccount.loggedIn({
    success: function (settings) {
      if (settings) {
        app.data.permissions = settings.permissions;
        Backbone.history.start({root: document.location.pathname});
      }
    }
  });

});
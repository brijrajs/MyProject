var myAccount = new ultracart.MyAccount(merchantId);
var templates = {};

function initialize() {
  myAccount.loggedIn({
    success: function (settings) {
      if (!settings) {
        displayLoginForm();
        jQuery('#recent-activity').html('');
      } else {
        displayWelcome(settings);
        loadRecentOrders();
      }
    }
  });
}

function displayLoginForm() {
  // enableButtons();
  jQuery('.welcome-message').html('Welcome to your account management screen.  Please login below.');
  jQuery('nav[role=navigation]').hide();
  jQuery('#login-form,#register-form').show();
}

function displayWelcome(settings) {
  jQuery('nav[role=navigation]').show();
  jQuery('.nav-logout').show();
  jQuery('#login-form,#register-form').hide(); // might already be hidden.  that's okay.

  var template = "Welcome <strong>{{firstName}} {{lastName}}</strong> to your account management screen.";
  var welcomeHB = Handlebars.compile(template);
  var html = welcomeHB(settings);
  jQuery('.welcome-message').html(html);
}

function emailPassword(event) {
  console.log('clicked');
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  clearAllMessages();

  var email = jQuery.trim(jQuery('#email').val());

  if (!email) {
    showError("Please enter your email to receive your password.");
    return;
  }

  disableButtons();

  //noinspection JSUnusedLocalSymbols
  myAccount.forgotPassword(email, {
    success: function (account) {
      enableButtons();
      showInfo("Your password was emailed to you.  Please check your inbox.");

    },
    failure: function (jqXHR, textStatus, errorThrown) {

      var message = jqXHR.getResponseHeader('UC-REST-ERROR');
      if (!message) {
        message = "We could not email your password to you at this time.  Please try again in a few minutes.";
      }

      showError(message);
      enableButtons();
    }
  });


}

function disableButtons() {
  jQuery('#login-button,#email-password-button').attr('disabled', true);
}
function enableButtons() {
  jQuery('#login-button,#email-password-button').attr('disabled', false);
}

function login(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  clearAllMessages();
  var email = jQuery.trim(jQuery('#email').val());
  var password = jQuery.trim(jQuery('#password').val());

  if (!email || !password) {
    showError("Both email and password are required to login.");
    return;
  }

  disableButtons();


  //noinspection JSUnusedLocalSymbols
  myAccount.login(email, password, {
    success: function (account) {
      enableButtons();
      displayWelcome(account);
      loadRecentOrders();

    },
    failure: function (textStatus, errorThrown) {
      showError("Login failed.  Please check your credentials and try again.");
      enableButtons();
    }
  });
}


function register(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  clearAllMessages();
  var email = jQuery.trim(jQuery('#register-email').val());
  var password = jQuery.trim(jQuery('#register-password').val());
  var passwordAgain = jQuery.trim(jQuery('#register-password-again').val());

  var redirectUrl = null;
  var redirectUrlEl = jQuery('#redirect-url');
  if(redirectUrlEl){
    redirectUrl = redirectUrlEl.val();
  }
  var themeCode = null;
  var themeCodeEl = jQuery('#theme-code');
  if(themeCodeEl){
    themeCode = themeCodeEl.val();
  }


  if (!email || !password || !passwordAgain) {
    showError("All fields are required to register.");
    return;
  }

  if (password != passwordAgain) {
    showError("Passwords do not match.  Please re-type your password in both fields.");
    return;
  }


  disableButtons();


  //noinspection JSUnusedLocalSymbols
  var settings = {'email': email, 'password': password};
  myAccount.createAccount(settings, {
    success: function (msg) {

      showInfo(msg);
      enableButtons();

    },
    failure: function (jqXHR, textStatus) {
      var message = jqXHR.getResponseHeader('UC-REST-ERROR');
      if (!message) {
        message = textStatus;
      }

      showError("Registration failed with the following message: " + message);
      enableButtons();
    },
    redirectUrl: redirectUrl,
    themeCode: themeCode
  });
}


function logout(event) {
  event.stopPropagation();

  //noinspection JSUnusedLocalSymbols
  myAccount.logout({
    success: function (account) {
      showSuccess("You were successfully logged out of your account.");
      initialize();
    },
    failure: function (textStatus, errorThrown) {
      showError("Logout failed.  Please refresh this page.");
    }
  });

  return false;
}

function loadRecentOrders() {
  //noinspection JSUnusedLocalSymbols
  myAccount.getOrders({
    filter: 'last6months',
    success: function (orders, pagination) {
      var html = 'No recent activity.';
      if (orders && orders.length) {
        var context = {'orders': orders};
        html = templates.recentOrders(context);
      }
      jQuery('#recent-activity').html(html);
    }
  });
}


jQuery(document).ready(function () {
  enablePleaseWaitMessage();

  templates.recentOrders = Handlebars.compile(jQuery('#recent-orders-template').html());

  initialize();

  jQuery('#login-button').bind('click', login);
  jQuery('#register-button').bind('click', register);
  jQuery('#email-password-button').bind('click', emailPassword);
  jQuery('.nav-logout a').bind('click', logout);

});

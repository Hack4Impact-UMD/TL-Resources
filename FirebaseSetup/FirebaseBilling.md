For the sake of security, I've decided to writeup the second part of the billing video instead of uploading it.
Just to reiterate, we are upgrading our plan from free to paid in order to use Cloud Functions.
The paid plan costs you 0$/month until you surpass the limits of the free plan.
This almost never happens since our projects tend to be on the smaller side.
Here is a Firebase Billing Calculator where you can find out how much it will charge you each month:
https://firebase.google.com/pricing. 

Now that you've set up the Blaze Plan, you need to have the NPO put their credit card into the billing profile.
The NPO will not be able to see your credit card details, and you will not be able to see theirs.
In order to allow the NPO to do this, you have to do 2 things.

1. Add the NPO to your Firebase as shown in the "Creating Your First Firebase Project" Video. 
To do this, go to settings in Firebase then click "users and permissions" and add the NPO's email to the Firebase
and give them the Owner role. Then, they will get an email saying that they've been invited to this project, and they
need to accept that email.

2. Add the NPO into the billing profile. To do this, go to Firebase and hit the settings icon. 
Then go to usage and billing and click "details and settings". Then click "View Account". On the top left of your screen
you should see the words "Google Cloud" followed by a dropdown that says "Select a Project". Select your project
from this dropdown. Then, on the left hand side, you should see a bunch of options. 

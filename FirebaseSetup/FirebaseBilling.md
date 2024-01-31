For the sake of security, I've decided to writeup the second part of the billing video instead of uploading it.
Just to reiterate, we are upgrading our plan from free to paid in order to use Cloud Functions.
The paid plan costs you $0 per month until you surpass the limits of the free plan.
This almost never happens since our projects tend to be on the smaller side.
Here is a Firebase Billing Calculator where you can find out how much it will charge you each month:
https://firebase.google.com/pricing. 

# Adding the NPO to the Billing Profile and Project
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
from this dropdown.

Then, on the left hand side, you should see a bunch of options. Scroll all the way down and click
"Account Management". 
![image](https://github.com/Hack4Impact-UMD/TL-Resources/assets/99225264/570a14ff-715b-419d-a73d-685f6f285ce8 | height=400)

The account management tab should look something like this. Go to the right hand side, click "Add Principal".
Under "Add Principals", add the NPOs email, assign them the role of "Billing Account Administrator", and hit
save. Now your work is done, and the NPO does the rest.
![image](https://github.com/Hack4Impact-UMD/TL-Resources/assets/99225264/8aa47bfa-044d-41d0-9ca5-af8df90c2c14)

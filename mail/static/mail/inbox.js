document.addEventListener('DOMContentLoaded', function() {

  // Send email
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject, 
        body: body,
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })

    .then(() => {load_mailbox('sent')})
    return false;
  }
  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email) {
  // Show compose view and hide other views
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // If replying to email, populate fields
  if (email.sender != undefined) {
    document.querySelector('#new-email').innerHTML = 'Reply';
    document.querySelector('#compose-recipients').value = email.sender;   
    if (email.subject.startsWith("Re:")) {
      document.querySelector('#compose-subject').value = email.subject;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n-----\n\n`;

  } else {
    // If new email, clear out composition fields
    document.querySelector('#new-email').innerHTML = 'New Email';
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Fetch appropriate emails
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach((email) => {
      // Create div row for each email
      const element = document.createElement('div');
      element.innerHTML = `<h6>${email.subject}</h6>${email.sender}<br>${email.timestamp}`
      element.addEventListener('click', () => {
        // Hide reply and archive buttons if viewing sent email
        if (mailbox == 'sent') {
          document.querySelector('#btn-archive').style.display = 'none';
          document.querySelector('#btn-reply').style.display = 'none';
        } else {
          document.querySelector('#btn-archive').style.display = 'inline';
          document.querySelector('#btn-reply').style.display = 'inline';
        }
        single_email_view(email);
      })
      document.querySelector('#emails-view').append(element); 
      
      // Mark emails as read or unread
      if (email.read) {
        element.setAttribute('class', 'email-read');
      } else {
        element.setAttribute('class', 'email-unread');
      }
    })
  })
}

function single_email_view(email) {
  // Show single email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';

  // Mark email as read
  if(!email.read) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })  
    })
  }

  // Load email details
  document.querySelector("#email-subject").innerHTML = email.subject;
  document.querySelector("#email-sender").innerHTML = `From: ${email.sender}`;
  document.querySelector("#email-recipients").innerHTML = `To: ${email.recipients}`;
  document.querySelector("#email-timestamp").innerHTML = email.timestamp;
  document.querySelector("#email-body").innerHTML = email.body;
    
  // Reply
  document.querySelector('#btn-reply').addEventListener('click', () => {
    compose_email(email)
  })

  // Archive/unarchive
  const btn_archive = document.querySelector('#btn-archive');
  if (!email.archived) {
    btn_archive.innerHTML = 'Archive'
  } else { 
    btn_archive.innerHTML = 'Unarchive'
  }
  btn_archive.onclick = (() => {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: !email.archived
      })
    })
    .then(() => {load_mailbox('inbox');})

  })
}
  
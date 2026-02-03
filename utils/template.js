module.exports = {
  verficationEmailTemplate: (name, otp, title = "Account Verification") => {
    return `
        <!DOCTYPE html>
        <html lang="en">
      
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 95%;}
            }
            @media only screen and (min-width: 601px) {
              .container { width: 50%; }
            }
          </style>
        </head>
      
        <body style='background-color:#fafaf5;padding-top:5px'>
          <div style='display:flex;margin-bottom:10px;margin-top:10px'>
            
          </div>
          <div style='display:flex;border-radius:10px;padding:10px;height:max-content;'>
            <div class='container' style='background-color:white;margin-left:auto;margin-right:auto;border-radius:10px;padding:10px;height:max-content;'>
              <div style='text-align:center'>
                
              </div>
              <div style='text-align: center; margin-bottom: 20px;'>
                <h1 style='color: #41ccad; font-family: sans-serif;'>${title}</h1>
              </div>
              <div>
                <p>Hi <strong>${name},</strong></p>
                <p>Your otp for Lorepa account is ${otp} </p>
              </div>
              <p style='color:#333333'>Our team is always here to help. If you have any questions or need further assistance, contact us via email at <span style='color:#41ccad;cursor:pointer;text-decoration: none;'>contact@lorepa.ca</span></p>
              <div>
                <p>Best Regards,</p>
              </div>
              <div>
                <p>Lorepa Team</p>
              </div>
                <div style='text-align: center;'>
                  <p style='color:#A3A9BB;font-size:0.7rem;'>© 2025 Lorepa Analytics Inc. All rights reserved.</p>
                </div>
              </div>
      
             </div>
          </body>
        `
  },
}

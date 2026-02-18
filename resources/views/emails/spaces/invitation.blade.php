<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: sans-serif;
            line-height: 1.5;
            color: #333;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <h2>Invitation to Collaborate</h2>
        <p>Hello,</p>
        <p>You have been invited to join the space <strong>{{ $space->name }}</strong> as a {{ $member->role }}.</p>

        <p>Click the button below to accept the invitation:</p>

        <a href="{{ env('FRONTEND_URL') }}/invites/{{ $member->invite_token }}" class="button">Accept Invitation</a>

        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            If you didn't expect this invitation, you can ignore this email.
        </p>
    </div>
</body>

</html>

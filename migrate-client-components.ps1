$srcDir = "d:\Docufieds\src"

# Files that still import useSession or signOut from next-auth/react
$files = @(
    "$srcDir\app\dashboard\individual\settings\page.tsx",
    "$srcDir\app\dashboard\individual\profile\page.tsx",
    "$srcDir\app\dashboard\individual\messaging\client-page.tsx",
    "$srcDir\app\dashboard\individual\new-application\client-page.tsx",
    "$srcDir\app\dashboard\agent\settings\page.tsx",
    "$srcDir\app\dashboard\agent\new-application\client-page.tsx",
    "$srcDir\app\dashboard\agent\approval\page.tsx",
    "$srcDir\app\dashboard\agent\applications\[id]\page.tsx",
    "$srcDir\app\dashboard\agency\new-application\client-page.tsx",
    "$srcDir\app\admin\templates\page.tsx",
    "$srcDir\app\admin\support-member\page.tsx",
    "$srcDir\app\admin\support\page.tsx",
    "$srcDir\app\admin\support-lead\layout.tsx",
    "$srcDir\app\admin\page.tsx",
    "$srcDir\app\admin\legal\layout.tsx",
    "$srcDir\app\admin\legal\applications\[id]\page.tsx",
    "$srcDir\app\admin\accounts\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file)
        
        if ($content -match "next-auth") {
            $newContent = $content
            
            # Remove useSession and signOut imports - various patterns
            $newContent = $newContent -replace "import \{ useSession, signOut \} from 'next-auth/react'\r?\n", ""
            $newContent = $newContent -replace "import \{ useSession \} from 'next-auth/react'\r?\n", ""
            $newContent = $newContent -replace "import \{ signOut \} from 'next-auth/react'\r?\n", ""
            
            # Replace useSession usage patterns
            # Remove const { data: session, status } = useSession() lines
            $newContent = $newContent -replace "\s*const \{ data: session, status \} = useSession\(\)\r?\n", "`n"
            $newContent = $newContent -replace "\s*const \{ data: session \} = useSession\(\)\r?\n", "`n"
            
            # Replace status checks with simpler patterns
            $newContent = $newContent -replace "if \(status === 'loading'\) return.*\r?\n", ""
            $newContent = $newContent -replace "if \(status === 'unauthenticated'\).*\r?\n.*router\.push.*\r?\n.*return\r?\n.*\}", ""
            
            # Replace session.user references
            $newContent = $newContent -replace "session\?\.user\.id", "user?.id"
            $newContent = $newContent -replace "session\.user\.id", "user?.id"
            $newContent = $newContent -replace "session\?\.user\.role", "user?.role"
            $newContent = $newContent -replace "session\.user\.role", "user?.role"
            $newContent = $newContent -replace "session\?\.user\.name", "user?.fullName"
            $newContent = $newContent -replace "session\.user\.name", "user?.fullName"
            $newContent = $newContent -replace "session\?\.user\.email", "user?.email"
            $newContent = $newContent -replace "session\.user\.email", "user?.email"
            
            # Replace signOut calls
            $newContent = $newContent -replace "await signOut\(\{ callbackUrl: '/' \}\)", "const supabase = (await import('@/lib/supabase/client')).createClient(); await supabase.auth.signOut(); window.location.href = '/'"
            $newContent = $newContent -replace "signOut\(\{ callbackUrl: '/' \}\)", "(async () => { const supabase = (await import('@/lib/supabase/client')).createClient(); await supabase.auth.signOut(); window.location.href = '/' })()"
            $newContent = $newContent -replace "await signOut\(\)", "const supabase = (await import('@/lib/supabase/client')).createClient(); await supabase.auth.signOut(); window.location.href = '/'"
            
            [System.IO.File]::WriteAllText($file, $newContent)
            Write-Output "MIGRATED: $file"
        } else {
            Write-Output "SKIP (no next-auth): $file"
        }
    } else {
        Write-Output "NOT FOUND: $file"
    }
}

Write-Output "Done!"
